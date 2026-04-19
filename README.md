# Centralized College Merchandise Management System (CCMMS)

A robust, MERN-stack web portal allowing college clubs to list and sell merchandise, while students maintain a unified profile for seamless ordering.

## 🚀 Features

- **Order Catalog**: A centralized view of all active merchandise listings across all college clubs with two-tier filtering.
- **Dynamic Size Profiling**: Students save their sizes (T-shirts, hoodies, etc.) once, and the system automatically pre-selects available items during checkout.
- **Simplified Workflow**: streamlined `processing` and `delivered` order lifecycle.
- **Delivery Slots System**: Club admins can schedule pick-up locations and times. The system auto-notifies all relevant buyers seamlessly.
- **Role-Based Access Control**: Strict segregation between Students, Club Admins, and Super Admins.

## 🛠️ Technology Stack
- **Frontend**: React, Vite, React Router, custom Vanilla CSS.
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB (Mongoose ODM).
- **Architecture**: Factory, Repository, Command, and Observer design patterns implemented for scalable business logic.

## 📦 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16+)
- [MongoDB](https://www.mongodb.com/) (running locally or a MongoDB Atlas URI)

### 1. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the environment variables:
   Ensure your `.env` file looks something like this:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/ccmms
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ADMIN_EMAIL=admin@ccmms.college
   ADMIN_PASSWORD=Admin@1234
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application at `http://localhost:5173`.

## ⚙️ Initial Super Admin Access
To manage the system and create your first Club and Club Admin account, log in using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` you provided in the backend `.env` file. From there, you can navigate to the Central Admin Panel.

---
*Built for Software Engineering — Team 37*
