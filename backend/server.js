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

// Seed Database on startup
const seedDatabase = async () => {
  try {
    const User = require('./src/models/User');
    const Club = require('./src/models/Club');

    // 1. Central Admin
    const adminEmail = process.env.ADMIN_EMAIL    || 'admin@ccmms.college';
    const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@1234';
    if (!(await User.findOne({ email: adminEmail }))) {
      await User.create({
        name: 'Central Admin',
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPass, 12),
        role: 'central_admin'
      });
      console.log(`✅ Central Admin seeded: ${adminEmail}`);
    }

    // 2. Demo Club Admin
    const demoClubEmail = 'demo.club@ccmms.com';
    const demoPass      = 'Demo@123';
    let demoClubAdmin = await User.findOne({ email: demoClubEmail });
    if (!demoClubAdmin) {
      demoClubAdmin = await User.create({
        name: 'Demo Club Admin',
        email: demoClubEmail,
        passwordHash: await bcrypt.hash(demoPass, 12),
        role: 'club_admin'
      });
      console.log(`✅ Demo Club Admin seeded: ${demoClubEmail}`);
    }

    // 3. Demo Club (Associate with Demo Club Admin)
    let demoClub = await Club.findOne({ name: 'Demo Club' });
    if (!demoClub) {
      demoClub = await Club.create({
        name: 'Demo Club',
        description: 'A shared club for demonstration purposes.',
        adminId: demoClubAdmin._id
      });
      await User.findByIdAndUpdate(demoClubAdmin._id, { clubId: demoClub._id });
      console.log(`✅ Demo Club created and linked to Admin`);
    }

    // 4. Demo Student User
    const demoUserEmail = 'demo.user@ccmms.com';
    if (!(await User.findOne({ email: demoUserEmail }))) {
      await User.create({
        name: 'Demo User',
        email: demoUserEmail,
        passwordHash: await bcrypt.hash(demoPass, 12),
        role: 'student',
        sizeProfile: { tshirt: 'L', hoodie: 'XL', other: 'Standard' }
      });
      console.log(`✅ Demo Student seeded: ${demoUserEmail}`);
    }

  } catch (err) {
    console.error('Database seed error:', err.message);
  }
};

connectDB().then(seedDatabase);

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

const path = require('path');

// ─── Production Serving ────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the React frontend/dist folder
  app.use(express.static(path.join(__dirname, '../frontend/dist')));

  // For any other route (non-API), send back the index.html file
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.resolve(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

// ─── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`CCMMS server running on http://localhost:${PORT}`));

module.exports = { app };
