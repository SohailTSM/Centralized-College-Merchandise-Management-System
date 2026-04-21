require('dotenv').config();
const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');

const connectDB = require('./src/config/db');

// Routes
const authRoutes         = require('./src/routes/authRoutes');
const userRoutes         = require('./src/routes/userRoutes');
const merchandiseRoutes  = require('./src/routes/merchandiseRoutes');
const orderRoutes        = require('./src/routes/orderRoutes');
const deliveryRoutes     = require('./src/routes/deliveryRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const adminRoutes        = require('./src/routes/adminRoutes');
const clubRoutes         = require('./src/routes/clubRoutes');

// Error middleware
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

// Patterns
const { registerNotificationObserver } = require('./src/patterns/observer/NotificationObserver');
const { registerDeliverySubscribers }  = require('./src/patterns/pubsub/DeliverySubscribers');

// ─── Bootstrap ────────────────────────────────────────────────────────────────
const app = express();

// Seed Central Admin on startup
const seedCentralAdmin = async () => {
  try {
    const User = require('./src/models/User');
    const adminEmail = process.env.ADMIN_EMAIL    || 'admin@ccmms.college';
    const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@1234';
    const existing   = await User.findOne({ email: adminEmail });
    if (!existing) {
      const passwordHash = await bcrypt.hash(adminPass, 12);
      await User.create({ name: 'Central Admin', email: adminEmail, passwordHash, role: 'central_admin' });
      console.log(`✅ Central Admin seeded — Email: ${adminEmail} | Password: ${adminPass}`);
    }
  } catch (err) {
    console.error('Admin seed error:', err.message);
  }
};

connectDB().then(seedCentralAdmin);

// Register observers/subscribers (no socket — DB notifications only)
registerNotificationObserver();
registerDeliverySubscribers();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth',           authRoutes);
app.use('/api/users',          userRoutes);
app.use('/api/merchandise',    merchandiseRoutes);
app.use('/api/clubs',          clubRoutes);
app.use('/api/orders',         orderRoutes);
app.use('/api/delivery-slots', deliveryRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/admin',          adminRoutes);

// ─── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CCMMS server running on http://localhost:${PORT}`));

module.exports = { app };
