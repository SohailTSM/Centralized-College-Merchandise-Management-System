require('dotenv').config({ path: '../../.env' });
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));

// app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
// app.use('/api/auth',           authRoutes);
// app.use('/api/users',          userRoutes);
// app.use('/api/merchandise',    merchandiseRoutes);
// app.use('/api/orders',         orderRoutes);
// app.use('/api/delivery-slots', deliveryRoutes);
// app.use('/api/notifications',  notificationRoutes);
// app.use('/api/admin',          adminRoutes);

// Routing table
const routes = {
  '/api/auth': 'http://localhost:5001/api/auth',
  '/api/users': 'http://localhost:5001/api/users',
  '/api/clubs': 'http://localhost:5002/api/clubs',
  '/api/merchandise': 'http://localhost:5002/api/merchandise',
  '/api/admin': 'http://localhost:5002/api/admin',
  '/api/orders': 'http://localhost:5003/api/orders',
  '/api/delivery-slots': 'http://localhost:5003/api/delivery-slots',
  '/api/notifications': 'http://localhost:5003/api/notifications',
};

// Apply proxy middlewares
for (const [path, target] of Object.entries(routes)) {
  app.use(path, createProxyMiddleware({ target, changeOrigin: true }));
}

// Fallback for unmatched routes
app.use((req, res) => res.status(404).send('API Gateway: Route not found.'));

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
