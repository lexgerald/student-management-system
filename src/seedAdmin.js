require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

(async () => {
  await connectDB();

  const exists = await User.findOne({ email: 'admin@sms.com' });
  if (exists) {
    console.log('Admin already exists');
  } else {
    await User.create({
      name: 'System Admin',
      email: 'admin@sms.com',
      password: 'Admin@123',
      role: 'admin',
    });
    console.log('Admin created: admin@sms.com / Admin@123');
  }

  await mongoose.disconnect();
})();