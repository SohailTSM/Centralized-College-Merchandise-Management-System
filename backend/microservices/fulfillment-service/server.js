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
