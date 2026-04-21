require('dotenv').config({path: '../../.env'});
const express  = require('express');
const cors     = require('cors');
const connectDB = require('./src/config/db');
const { notFound, errorHandler } = require('./src/middleware/errorMiddleware');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');

const app = express();
connectDB();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = 5001;
app.listen(PORT, () => console.log(`[Auth Service] running on port ${PORT}`));
module.exports = { app };
