# Architecture Decision Records (ADR)

This document contains four major architectural design decisions made during the development of the Centralized College Merchandise Management System (CCMMS), formatted according to the **Michael Nygard ADR Template**.

---

## ADR 001: Centralized Monolithic Database over Isolated Data Silos

- **Status:** Accepted
- **Context:** The university has multiple clubs, each running independent merchandise sales. Initially, we considered giving each club an isolated tenant database or separate application deployment to maximize data privacy and autonomy. However, a key requirement is that a student should only have to enter their sizing profile (T-Shirt, Hoodie) once for all future orders across any club.
- **Decision:** We will use a single, centralized Monolithic MongoDB database to store both Student and Club data together in unified collections, linked via foreign keys (`clubId`).
- **Consequences:**
  - **Positive:** Student size profiles are globally accessible to the checkout system regardless of which club's item is being purchased. It enables a unified "Global Catalog" UI.
  - **Negative:** Data isolation relies entirely on application-level filtering (authMiddleware.js and strict repository queries). A bug in the query logic could expose one club's financial data to another.

---

## ADR 002: Implementation of the Factory Pattern for Product Creation

- **Status:** Accepted
- **Context:** Merchandise items vary in their attributes. T-shirts and Hoodies require an array of available sizes (XS to XXL). Caps and Mugs, however, only have a single "Standard" size. Writing conditional `if/else` statements in the routing layer to handle validation for these varying types would lead to fragile, monolithic controllers.
- **Decision:** Implement a **Factory Design Pattern** (MerchandiseFactory.js) to encapsulate the creation logic of merchandise. The factory accepts a product type and payload, constructs the appropriate class (`TshirtProduct`, `CapProduct`), validates the specific fields natively, and outputs a standardized document.
- **Consequences:**
  - **Positive:** High extensibility. If a club wants to sell "Event Tickets" in the future with completely different constraints (e.g., date ranges instead of sizes), developers simply register a new class in the factory without touching the core routing layer.
  - **Negative:** Introduces a slight layer of abstraction that requires junior developers to understand the Factory mechanics rather than writing straightforward procedural code.

---

## ADR 003: Use of Internal Event-Driven Pub/Sub for Delivery Notifications

- **Status:** Accepted
- **Context:** When a Club Admin schedules a "Delivery Pickup Slot," the system must notify all students who purchased the covered merchandise and whose orders are currently in the `processing` state. Querying the database to find matching orders and iterating to create notifications is heavy. Performing this synchronously inside the HTTP request would block the Admin's UI, causing poor latency.
- **Decision:** Implement an internal **Publish-Subscribe (Pub/Sub) Architecture** using a custom EventBus class and an **Observer Pattern** (OrderEventEmitter.js). The API endpoint will instantly save the delivery slot and emit a `slot:created` event asynchronously. The DeliverySubscribers.js module will listen in the background, run the heavy queries, and write the notifications.
- **Consequences:**
  - **Positive:** Sub-100ms API response times for the Club Admin, leading to a highly responsive UI. Complete decoupling of the Delivery module from the Notification module.
  - **Negative:** Because the EventBus utilizes built-in Node.js in-memory events rather than an external durable broker (like Kafka), if the Node instance crashes precisely as an event is emitted, the background notifications will be permanently lost. This trade-off was accepted given the bounded scale of a college portal.

---

## ADR 004: Adopting the Repository Pattern for Data Access Abstraction

- **Status:** Accepted
- **Context:** In early iterations of the MERN stack, the Express controllers contained direct Mongoose ORM queries (e.g., `Order.find({ clubId: req.user.clubId })`). This tightly coupled the business logic directly to the MongoDB infrastructure, making testing difficult and code repetition high.
- **Decision:** All database interactions must be encapsulated behind **Repository Pattern** classes (e.g., UserRepository, OrderRepository). Controllers must interact with databases strictly through Repository methods like `UserRepository.findByEmail(email)`.
- **Consequences:**
  - **Positive:** The application's business logic is decoupled from the Mongoose ORM. If we modify the database schema or migrate to a SQL database in the future, we only have to update the Repository classes. It also forces code reusability.
  - **Negative:** Adds boilerplate code. A simple endpoint requires routing through `Controller → Repository → Model` instead of `Controller → Model`.
