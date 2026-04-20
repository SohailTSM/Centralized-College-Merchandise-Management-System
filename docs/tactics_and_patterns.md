# Architectural Tactics & Implementation Patterns

This document details the architectural tactics employed within the Centralized College Merchandise Management System (CCMMS) to satisfy Non-Functional Requirements (NFRs), alongside an analysis of the core implementation design patterns utilized in the codebase.

---

## 1. Architectural Tactics

Tactics are design decisions focused on controlling specific quality attributes (NFRs). We employed the following four tactics:

### A. Decouple Event Producers from Consumers (via Pub-Sub)

- **Goal Addressed:** Performance (Latency) & Maintainability.
- **Explanation:** When an admin creates a delivery slot, the system must search the database and construct potentially hundreds of notifications for buyers. Doing this synchronously would block the HTTP response (high latency). We employed a decoupling tactic using an internal EventBus. The delivery controller simply emits a `slot:created` event (Producer) and returns a `200 OK` instantly to the admin. Independent background subscribers (Consumers) catch the event and process the notifications later.

### B. Data Access Abstraction

- **Goal Addressed:** Modifiability & Testability.
- **Explanation:** Rather than scattering direct database queries (e.g., `mongoose.Model.find()`) throughout the Express Route controllers, we abstracted database interaction into individual **Repository classes**. If the underlying database schema changes, or if we migrate from MongoDB to PostgreSQL, we only need to modify the repository layer. The controller layer remains untouched.

### C. Stateless Session Management

- **Goal Addressed:** Scalability & Security.
- **Explanation:** We avoided traditional server-side `express-session` cookies which store user state in server memory. Instead, we issue **JSON Web Tokens (JWT)** on login. Every client request contains the JWT, providing the server with cryptographically verified identity and role data. This tactic ensures the backend is completely stateless, meaning we can horizontally scale to multiple server instances in load-balanced environments without worrying about sticky sessions.

### D. Upfront Boundary Validation

- **Goal Addressed:** Reliability & Security.
- **Explanation:** Invalid application states (such as a negative price or a missing club association) can crash the database or compromise business logic. We use tactical input validation boundaries explicitly inside our Factory instantiation. A product object refuses to compile into a database entity if `.validate()` fails, protecting our persistent storage layer from malformed data objects sent from the client.

---

## 2. Implementation Patterns

Our codebase utilizes several gang-of-four (GoF) design patterns to structure business logic logically. Here are two prominent patterns utilized:

### 1. The Factory Pattern (MerchandiseFactory)

**Role in Architecture:**
The Factory pattern abstracts the instantiation logic of various merchandise types. T-shirts require a complex array of available sizes (`XS, S, M, L, XL`), whereas Caps or Mugs use a fixed `Standard` size. Instead of having messy conditional branches inside our `merchandiseController`, the Controller delegates creation to the MerchandiseFactory. The Factory ensures that every product type adheres to its respective constraint rules before handing the normalized object to the Repository.

**Pattern Implementation & Diagram:**

![Factory Pattern Diagram](./design/uml_files/png/class_factory_pattern.png)

```javascript
const makeProduct = (type, defaultSizes) =>
  class {
    constructor(data) {
      this.type = type;
      this.name = data.name;
      this.price = data.price;
      this.availableSizes =
        data.availableSizes && data.availableSizes.length > 0
          ? data.availableSizes
          : defaultSizes;
      this.clubId = data.clubId;
    }
    validate() {
      return this.name && this.price > 0 && this.clubId;
    }
  };

const TshirtProduct = makeProduct("tshirt", ["XS", "S", "M", "L", "XL", "XXL"]);
const MugProduct = makeProduct("mug", ["Standard"]);

class MerchandiseFactory {
  static create(type, data) {
    switch (type) {
      case "tshirt":
        return new TshirtProduct(data);
      case "mug":
        return new MugProduct(data);
      default:
        throw new Error(`Unknown merchandise type: ${type}`);
    }
  }
}
```

### 2. The Command Pattern (`OrderCommands`)

**Role in Architecture:**
The Command pattern encapsulates all information needed to perform an action or trigger an event into a single cohesive object. In CCMMS, calculating an order's total amount, associating the student, validating the status, and interacting with the database are wrapped inside the PlaceOrderCommand and UpdateOrderStatusCommand objects.

This is incredibly powerful because it decouples the _intent_ to create an order from the _execution_. A CommandInvoker executes the command and logs it into its history object, which future-proofs the system for "Undo" functionality (e.g. canceling a wrongly marked `delivered` status) or executing commands asynchronously through a job queue.

**Pattern Implementation & Diagram:**

![Command Pattern Diagram](./design/uml_files/png/class_command_pattern.png)

```javascript
class PlaceOrderCommand {
  constructor(orderData) {
    this.orderData = orderData;
    this.createdOrder = null;
  }
  async execute() {
    const order = await OrderRepository.create(this.orderData);
    this.createdOrder = order;
    orderEventEmitter.emitOrderPlaced(order); // Notify student
    return order;
  }
}

class CommandInvoker {
  constructor() {
    this.history = [];
  }
  async run(command) {
    const result = await command.execute();
    this.history.push(command);
    return result;
  }
}
// Usage: commandInvoker.run(new PlaceOrderCommand(req.body))
```

### 3. Additional Design Patterns

Beyond the core implementations of Factory and Command outlined above, the CCMMS platform utilizes several other classical patterns throughout its domain:

- **Repository Pattern:** Employed universally across all database interactions (e.g., OrderRepository.js, MerchandiseRepository.js). It creates a strict abstraction boundary so business controllers never interact directly with Mongoose ORM methods, guaranteeing that logic is isolated and testable.
- **Observer & Pub-Sub Patterns:** The OrderEventEmitter acts as the mathematical Observer, continuously watching for transactional state changes. It works closely with the internal EventBus.js (Pub-Sub pattern) to decouple heavy background operations—such as calculating and writing notifications to dozens of student accounts—away from blocking the API thread.
- **Builder Pattern:** Employed locally inside the utilities (`UserProfileBuilder`) to incrementally parse and construct complex dynamic User and Size Profile datasets during account registration, completely avoiding "telescoping constructor" anti-patterns.

**NOTE: All the class, sequence and C4 diagrams illustrating these patterns are available in the `docs/design/diagrams` directory of the repository in pdf format and are also available in the `docs/design/uml_files/png` directory of the repository in png format.**
