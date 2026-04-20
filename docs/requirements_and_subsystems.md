# Requirements & Subsystems Overview

This document formally outlines the functional and non-functional requirements, their architectural significance, and details the primary subsystems designed in the Centralized College Merchandise Management System (CCMMS).

---

## 1. System Requirements

### Functional Requirements
1. **Unified Catalog Management:** Students must be able to view, search, and filter active merchandise listings belonging to any registered college club from a single interface.
2. **Persistent Student Size Profiling:** Students must be able to register a global size profile (e.g., T-shirt: M, Hoodie: L) which the system utilizes to automatically validate size availability during checkout.
3. **Order Lifecycle Management:** Students must be able to place single-item orders instantly (no shopping cart). Club Admins must be able to track and update the status of these orders (e.g., `processing` → `delivered`).
4. **Dynamic Delivery Slot Scheduling:** Club Admins must be able to schedule location-based pickup slots linked to either all their merchandise or specific items.
5. **Real-time Event Notifications:** The system must automatically dispatch in-app notifications to relevant students when an order state changes or a delivery slot affecting their order is created/updated.
6. **Role-Based Access Control (RBAC):** The system must restrict routes and views based on strict roles: Students, Club Admins, and Central/Super Admins.

### Non-Functional Requirements
1. **Latency (Performance):** Because merchandise drops often cause spikes in student traffic, standard catalog retrieval and order placement APIs must resolve in `< 100ms`.
2. **Data Consistency (Reliability):** Order placement must be executed atomically. The system must never assign a student to a delivery slot for an item they do not have a processing order for.
3. **Stateless Security:** Sessions must be managed securely and statelessly via JSON Web Tokens (JWT) to ensure horizontal scalability on the backend.
4. **Extensibility & Maintainability:** The codebase must adhere to established design patterns (Repository, Factory, Command, Pub/Sub) so new product types (e.g., lanyards, tickets) or notification channels (e.g., email) can be added without rewriting the core framework.

---

## 2. Architecturally Significant Requirements

When bridging the gap between requirements and our MERN implementation, two keys drove the system blueprint:

1. **Persistent Size Profiling & Unified Catalog:** 
   * **Architectural Impact:** This functional requirement mandated the creation of a *Monolithic Centralized Database* (MongoDB). If we had siloed data per club (which is how campus organizations usually operate manually), the student would have to re-enter sizes constantly, defeating the purpose of a centralized hub.
2. **Real-time Event Notifications for Delivery Slots:** 
   * **Architectural Impact:** This requirement heavily impacted our behavioral architecture. Creating a delivery slot and finding every buyer who needs to be notified is an expensive database operation. To prevent this from slowing down the Admin's API response, we implemented an internal **Publish/Subscribe Architecture ([EventBus](file:///home/sohailtsm/M%20Tech%20Contents/SEM%20II/SE/Projects/project3/backend/src/patterns/pubsub/EventBus.js#7-30))**. When a slot is created, the API returns instantly, while the decoupled [DeliverySubscribers](file:///home/sohailtsm/M%20Tech%20Contents/SEM%20II/SE/Projects/project3/backend/src/patterns/pubsub/DeliverySubscribers.js#11-85) run the data-matching and notification logic asynchronously in the background.

---

## 3. Subsystem Overview

The CCMMS backend is segmented into four primary subsystems. Each subsystem handles a distinct domain of business logic, mapped internally to specific Controllers, Repositories, and Patterns.

### A. Authentication & Access Subsystem
* **Role:** Manages system entry, user identity, and route restriction based on hierarchical roles.
* **Functionality:** Handles JWT generation during login/registration via the `authController`. Uses the internal `rbacMiddleware.js` implementation to inspect JSON Web Tokens and block unauthorized access (e.g., preventing a student from accessing a `DELETE /api/admin/clubs` route).

### B. Catalog Management Subsystem
* **Role:** Governs the creation, validation, and retrieval of club merchandise listings.
* **Functionality:** Defines how items are modeled. It utilizes the **Factory Pattern** ([MerchandiseFactory.js](file:///home/sohailtsm/M%20Tech%20Contents/SEM%20II/SE/Projects/project3/backend/src/patterns/factory/MerchandiseFactory.js)) to distinctively construct products with varied requirements (e.g., T-shirts enforce a 6-tier size array, whereas Caps enforce a single `Standard` size) before committing them to the [MerchandiseRepository](file:///home/sohailtsm/M%20Tech%20Contents/SEM%20II/SE/Projects/project3/backend/src/repositories/MerchandiseRepository.js#3-37).

### C. Order Processing Subsystem
* **Role:** Manages the transactional logic of converting a student's single-item purchase into an active business order.
* **Functionality:** Utilizes the **Command Pattern** ([OrderCommands.js](file:///home/sohailtsm/M%20Tech%20Contents/SEM%20II/SE/Projects/project3/backend/src/patterns/command/OrderCommands.js)). The [PlaceOrderCommand](file:///home/sohailtsm/M%20Tech%20Contents/SEM%20II/SE/Projects/project3/backend/src/patterns/command/OrderCommands.js#8-20) encapsulates the validation and creation of an order record. If a student changes their size preferences later, it does not mutate existing frozen orders managed by this subsystem.

### D. Delivery & Notification Subsystem
* **Role:** The event-driven core of the application that manages communication between club admins and students regarding physical fulfillment.
* **Functionality:** Club Admins interact with the [DeliverySlotRepository](file:///home/sohailtsm/M%20Tech%20Contents/SEM%20II/SE/Projects/project3/backend/src/repositories/DeliverySlotRepository.js#3-32) to schedule pick-ups. This subsystem relies entirely on the **Observer Pattern ([OrderEventEmitter](file:///home/sohailtsm/M%20Tech%20Contents/SEM%20II/SE/Projects/project3/backend/src/patterns/observer/OrderEventEmitter.js#7-15))** and **Pub-Sub Pattern ([EventBus.js](file:///home/sohailtsm/M%20Tech%20Contents/SEM%20II/SE/Projects/project3/backend/src/patterns/pubsub/EventBus.js))** to detect lifecycle changes, query the database for affected buyers, and dispatch in-app notifications without tightly coupling the order logic with the delivery logic.
