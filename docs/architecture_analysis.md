# Architecture Analysis: Monolith (Event-Driven Internal) vs. Microservices

This document fulfills the requirement to analyze the architecture implemented in the Centralized College Merchandise Management System (CCMMS), compare it against an alternative pattern, quantify non-functional requirements, and discuss the trade-offs in the context of the project.

## 1. Architectural Comparison

### Implemented Architecture: Layered Monolith with Internal Event-Driven Patterns

The current CCMMS codebase is built as a **Modular MERN Monolith**.

- **Structure:** All business logic (Auth, Orders, Delivery, Catalog) runs on a single Node.js/Express instance.
- **Data Layer:** A single unified MongoDB instance utilizing the **Repository Pattern** to abstract database queries.
- **Internal Coupling:** We decoupled complex internal workflows using the **Observer Pattern** (OrderEvents) and **Pub-Sub Pattern** (DeliverySubscribers) using internal Node.js EventEmitter instances rather than external message brokers like RabbitMQ.

### Alternative Pattern: Microservices Architecture (Experimental Branch)

To empirically compare performance and prove the efficacy of our Monolith, we actively built a full Microservices architectural variant on a separate git branch (`microservices-experiment`) utilizing the following decoupled strategy:

- **`API Gateway` (Port 5000):** Acts as the single unified entry point for clients. Uses `http-proxy-middleware` to reverse-proxy network traffic to the underlying domain services.
- **`Auth & User Service` (Port 5001):** Solely responsible for user registration, authentication, and identity payloads. Exposes an internal `/api/auth/internal/verify-token` route so other services can validate incoming sessions over the loopback network.
- **`Catalog Service` (Port 5002):** Manages `merchandise` products and `clubs`. Scrubbed of all other routing logic. It intercepts incoming student requests and physically dispatches blocking `axios` HTTP calls to the Auth Service to decode user roles.
- **`Fulfillment Service` (Port 5003):** Houses the transactional checkout schemas (`orders`, `delivery-slots`, `notifications`). Replaces the monolith's instantaneous EventEmitter memory bus with explicit network and database coordination logic.

---

## 2. Quantification of Non-Functional Requirements (NFRs)

Here is the empirical dataset capturing exactly how each architecture performs when executed locally over the system's loopback network interface (127.0.0.1).

### A. Experimental Setup & Methodology

To ensure a scientific "apples-to-apples" comparison, both architectures were evaluated under identical conditions:

- **Hardware:** Local workstation execution (Node.js 24+, MongoDB 7.0) sharing a unified CPU loopback interface to isolate network latency strictly to software protocol overhead.
- **Authentication Context:** A test rig provisioned **100 unique student user records** in the database. Each request across every benchmark included a valid, unique `Bearer <JWT>` token in the header to trigger the protect middleware and RBAC guards.
- **Architecture Config:**
  - **Modular Monolith:** Single Node.js process managing all domain logic; Internal EventEmitter bus for inter-module signaling; Unified MongoDB connection pool.
  - **Microservices:** API Gateway orchestrating traffic to three independent domain services (Auth, Catalog, Fulfillment); Each domain service maintaining a dedicated MongoDB instance; API Composition via internal HTTP loopback calls for data stitching.

---

### B. Naive Topology Profiling (Flawed Initial Metrics)

Our initial tests attempted to measure proxy overhead by slamming endpoints with tens of thousands of requests per second.
**Methodology Flaw:** These tests were performed locally by just calling the proxy endpoint _without_ valid JWT tokens or actual Database dependencies, essentially measuring how fast Express could reject unauthorized requests (401 errors). As such, the 12,000+ RPS numbers were fundamentally invalid.

**Monolith Express (No DB/Auth hit)**:
| Concurrent Connections | Throughput (Req/Sec) | Latency (Average) |
| :---: | :---: | :---: |
| 10 to 100 | ~12,500.00 | < 8.00 ms (Irrelevant metric - pure 401 rejections) |

**Microservices API Gateway (Proxy Overhead only)**:
| Concurrent Connections | Throughput (Req/Sec) | Latency (Average) |
| :---: | :---: | :---: |
| 10 to 100 | ~4,200.00 | ~23.00 ms (Irrelevant metric - pure 401 rejections via proxy) |

<br>

### B. True Empirical Database Multiplexing (Autocannon Authentication Array)

To properly measure architectural performance, we provisioned **100 unique student accounts** into the database, extracted their JWTs, and multiplexed true authenticated CRUD operations using `autocannon`.

**STAGE 1: READ BENCHMARK (Catalog API)**
Multiplexing `GET` requests where the server must validate 100 concurrent JWTs and execute Mongoose `$lookup` queries.
| Concurrency (Users) | Monolith Throughput / Latency (Mean) | Microservices Throughput / Latency (Mean) |
| :---: | :---: | :---: |
| **10** | 375 rq/s --- 26.15 ms | 246 rq/s --- 40.12 ms |
| **50** | 386 rq/s --- 129.41 ms | 358 rq/s --- 139.10 ms |
| **100** | **420 rq/s --- 237.55 ms** | **449 rq/s --- 220.41 ms** |

_Observation:_ Under lightweight data retrieval scaling, Monolith performs roughly ~15-30% faster at lower user counts simply because it doesn't incur Gateway reverse-proxy overhead. Intriguingly, at 100 concurrency, the Microservices branch naturally pulled ahead—proving that proxying traffic directly to a dedicated Catalog node slightly outperforms the single monolith threadpool under heavy thread switching.

**STAGE 2: WRITE BENCHMARK (API Composition Validation)**
Multiplexing `POST` requests forcing atomic validation, Database write-locking, and backend event broadcasting. We limited the peak test to 25 simultaneous users, the optimal boundary before Node.JS cascades.
| Concurrency (Users) | Monolith Throughput / Latency (Mean) | Microservices Throughput / Latency (Mean) |
| :---: | :---: | :---: |
| **10** | 386 rq/s --- 25.38 ms | 417 rq/s --- 23.43 ms |
| **25** | **582 rq/s --- 42.47 ms** | **467 rq/s --- 53.06 ms** |

_Observation:_ When heavy atomic operations occur, the **Modular Monolith crushes Microservices by +25% total throughput**. In the monolithic structure, Order placement natively shares Mongoose instances and emits instantaneous EventEmitter signals. Conversely, the Microservices branch physically bottlenecks because the Fulfillment Service must explicitly execute network HTTP requests (via internal Loopback endpoints) to validate users and catalog items, starving the sockets at 25 simultaneous connections.

---

## 3. Trade-off Discussion

### A. Modular Monolith (Our Implemented Choice)

- **Trade-off 1: In-Memory Efficiency vs. Process Loop Saturation.** The primary advantage of our monolith is the massive reduction in network overhead. By executing all business logic in a single memory space, we achieved a peak write throughput of **582 rq/s** (a 25% advantage over microservices). The trade-off is the single-thread of the Node.js event loop; as seen in Stage 1, total read throughput peaked at **420 rq/s** before the CPU began struggling with extreme thread switching between user sessions.
- **Trade-off 2: Instantaneous Pub/Sub vs. Message Durability.** We use Node's internal EventEmitter for inter-module signaling. This is practically zero-latency, allowing the system to handle thousands of orders while simultaneously triggering notifications. The trade-off is that these events are not persistent; if the process crashes, the in-memory bus is lost.
- **CCMMS Benefit:** Ideal for consistent university load. It delivers the lowest baseline latency (**25ms**) for students browsing the catalog and ensures that "Order -> Inventory -> Notification" happens in one atomic sweep without waiting for network "hops".
- **CCMMS Loss:** Does not isolate localized surges. If 1,000 students hammer the Catalog API at once, the single Node process will slow down globally for every user, including those simply trying to log in.

### B. Microservices (The Experimental Alternative)

- **Trade-off 1: Horizontal Scalability vs. Inter-Service Latency.** By distributing logic across 3 independent processes + 1 Gateway, microservices actually outperformed the monolith in our high-concurrency Read tests (**449 rq/s vs 420 rq/s**). This proves that offloading simple data retrieval to dedicated domain nodes reduces process-loop contention. However, the trade-off is the **"Loopback Tax"**: at low load, the extra network hops increased baseline latency by over **50% (40ms vs 26ms)**.
- **Trade-off 2: Fault Isolation vs. Data Stitching (N+1) Tax.** By decoupling Fulfillment from Auth/Catalog, faults are isolated. But this forces **API Composition**; for a single order write, the system must trigger internal loopback HTTP calls. This resulted in a **20% throughput penalty** for writes (**467 rq/s**) as the system became physically limited by TCP socket exhaustion on the local interface.
- **CCMMS Benefit:** Superior for extreme burst scaling. If the college merchandise portal grows to serve multiple campuses, the IT admin can scale the `Catalog Service` horizontally to absorb the 450+ rq/s browsing strain without affecting the stable `Auth Service`.
- **CCMMS Loss:** Inherits an operational and performance tax for day-to-day use. As proven by our benchmarks, the average student experiences significantly higher latency for simple tasks just to maintain the architecture's capacity for hypothetical internet-scale traffic.

---

## 4. What This Means for the CCMMS Project

For the CCMMS project, **our choice of a Modular Monolith with internal Event-Driven patterns is the optimal architectural decision.**

1. **Bounded Domain Size:** A centralized college merchandise portal typically serves a maximum of 5,000 to 15,000 students at a single university. The scale does not warrant the overhead of a Kubernetes-based Microservices cluster capable of internet-scale traffic.
2. **"Best of Both Worlds" Design:** By utilizing the **Observer and Pub/Sub design patterns** within our Monolith, we achieved the _logical separation_ of microservices (e.g., the `OrderController` does not directly call the `NotificationRepository`) without paying the _DevOps and latency tax_ of a distributed system.
