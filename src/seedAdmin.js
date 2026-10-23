require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');

(async () => {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD first');
    process.exit(1);
  }

  await connectDB();

  if (await User.findOne({ email })) {
    console.log('Admin already exists');
  } else {
    await User.create({ name: 'System Admin', email, password, role: 'admin' });
    console.log(`Admin created: ${email}`);
  }

  await mongoose.disconnect();
})();