require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Course = require('./models/Course');

(async () => {
  await connectDB();

  const user = await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'password123',
    role: 'admin',
  });
  console.log('User created:', user.email);

  const course = await Course.create({
    name: 'Introduction to Programming',
    code: 'cs101',
  });
  console.log('Course created:', course.code);

  await mongoose.disconnect();
})();