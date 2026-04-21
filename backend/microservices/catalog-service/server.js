require('dotenv').config({path: '../../.env'});
const express  = require('express');
const cors     = require('cors');
const connectDB = require('./src/config/db');

// Explicitly register all Mongoose Schemas for Microservice Cross-Population
require('./src/models/User');
require('./src/models/Club');
require('./src/models/Merchandise');
require('./src/models/Order');
require('./src/models/Notification');
require('./src/models/DeliverySlot');

const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

const merchandiseRoutes = require('./src/routes/merchandiseRoutes');
const adminRoutes = require('./src/routes/adminRoutes'); // Admin manages clubs

const app = express();
connectDB();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/merchandise', merchandiseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/clubs', require('./src/routes/clubRoutes'));

app.use(notFound);
app.use(errorHandler);

const PORT = 5002;
app.listen(PORT, () => console.log(`[Catalog Service] running on port ${PORT}`));
module.exports = { app };
