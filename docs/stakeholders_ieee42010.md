# Stakeholder Identification & Viewpoints (IEEE 42010)

Following the **ISO/IEC/IEEE 42010 standard** for Architecture Description, this document identifies the core stakeholders for the Centralized College Merchandise Management System (CCMMS), outlines their primary concerns, and specifies the viewpoints and architectural views that address those concerns.

---

## 1. Stakeholders & Their Concerns

### A. Students (End Users / Consumers)

- **Role:** Browse merchandise, configure size profiles, place orders, and pick up items.
- **Concerns:**
  - **Usability & Consistency:** A unified shopping experience allowing them to buy items from any club without creating separate accounts.
  - **Personalization:** Avoiding the frustration of constantly looking up or entering specific size measurements when ordering different apparel.
  - **Transparency:** Knowing exactly when an order transitions from "processing" to "delivered," and where/when to pick it up.

### B. Club Admins (Merchants / Operators)

- **Role:** Manage their club's merchandise catalog, track student orders, and schedule bulk delivery/pickup slots.
- **Concerns:**
  - **Data Isolation:** Ensuring their merchandise and order data is protected and not modifiable by rival clubs.
  - **Operational Efficiency:** The ability to mass schedule a single delivery slot and have the system automatically notify all applicable buyers, eliminating manual email blasts.
  - **Sales Tracking:** Clear dashboards to visualize revenue, pending orders, and active listings.

### C. Central / Super Admins (System Owners)

- **Role:** Approve the creation of clubs and assign the initial Club Managers.
- **Concerns:**
  - **System Integrity:** Ensuring only legitimate college clubs are granted access to sell on the platform.
  - **Security:** Preventing privilege escalation (e.g., stopping a standard student from assigning themselves as a Club Admin).

### D. Developers / Maintainers (Engineers)

- **Role:** Build, debug, and expand the CCMMS codebase.
- **Concerns:**
  - **Extensibility:** How easily a new merchandise category (e.g., Event Tickets) or feature can be added in the future.
  - **Testability & Coupling:** Ensuring business logic isn't tightly bound to the database framework (Mongoose) so unit testing remains viable.

---

## 2. Viewpoints and Views

To address the documented concerns, the architecture is described using specific viewpoints tailored to the stakeholders.

### 1. Functional / Logical Viewpoint

- **Addresses Concerns Of:** Developers, Maintainers
- **Design Addressed:** The system uses a layered architecture utilizing the **Repository Pattern** and **Factory Pattern**. This viewpoint describes how data access is abstracted (so business logic isn't coupled to MongoDB calls), and how the **MerchandiseFactory** ensures extensibility when adding new product types.
- **Relevant View:** Class Diagrams, Component Diagrams (C4).

### 2. Information / Data Viewpoint

- **Addresses Concerns Of:** Club Admins, Super Admins
- **Design Addressed:** Details the centralized MongoDB schema. It explains how a globally unified user document holds the persistent `SizeProfile`, whilst strict `clubId` foreign keys enforce data isolation, preventing clubs from seeing orders that do not belong to them.
- **Relevant View:** Entity Relationship Diagrams / Schema Models.

### 3. Behavioral / Event Viewpoint

- **Addresses Concerns Of:** Students, Club Admins
- **Design Addressed:** Focuses on the asynchronous processing flows. It explains how the **Publish-Subscribe (EventBus)** and **Observer (OrderEventEmitter)** patterns work together. When an admin schedules a delivery slot, this viewpoint tracks the event logic that finds matching processing orders and triggers in-app alerts, guaranteeing Student transparency and Admin efficiency.
- **Relevant View:** Sequence Diagrams, State/Activity Diagrams.

### 4. Security & Access Viewpoint

- **Addresses Concerns Of:** Super Admins, Students
- **Design Addressed:** Explains the stateless JSON Web Token (JWT) strategy and the `rbacMiddleware` (Role-Based Access Control) which physically intercepts API requests, verifying whether a user holds proper authorization (`student` vs `club_admin` vs `central_admin`) before allowing execution.
- **Relevant View:** Network Context Diagrams, API Gateway flows.
