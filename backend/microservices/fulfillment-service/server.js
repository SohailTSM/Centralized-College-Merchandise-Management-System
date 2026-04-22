require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const connectDB = require('./src/config/db');

// Database-per-service requires explicitly no cross-population


const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');

const orderRoutes = require('./src/routes/orderRoutes');
const deliveryRoutes = require('./src/routes/deliveryRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

const { registerNotificationObserver } = require('./src/patterns/observer/NotificationObserver');
const { registerDeliverySubscribers }  = require('./src/patterns/pubsub/DeliverySubscribers');

const app = express();
connectDB();

registerNotificationObserver();
registerDeliverySubscribers();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/orders', orderRoutes);
app.use('/api/delivery-slots', deliveryRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = 5003;
app.listen(PORT, () => console.log(`[Fulfillment Service] running on port ${PORT}`));
module.exports = { app };
