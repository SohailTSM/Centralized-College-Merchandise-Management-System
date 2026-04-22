const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedCentralAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@ccmms.college';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await User.create({
        name: 'Central Administrator',
        email: adminEmail,
        passwordHash,
        role: 'central_admin',
      });
      console.log('Central Admin seeded successfully.');
    }
  } catch (error) {
    console.error('Error seeding Central Admin:', error.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedCentralAdmin();
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
