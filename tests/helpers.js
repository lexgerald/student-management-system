const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Teacher = require('../src/models/Teacher');
const Student = require('../src/models/Student');

const PASSWORD = 'Password123';

const login = async (email) => {
  const res = await request(app).post('/api/auth/login').send({ email, password: PASSWORD });
  return res.body.token;
};

exports.login = login;
exports.PASSWORD = PASSWORD;

exports.createAdmin = async () => {
  await User.create({ name: 'Admin', email: 'admin@example.com', password: PASSWORD, role: 'admin' });
  return login('admin@example.com');
};

exports.createTeacher = async (n) => {
  const user = await User.create({ name: `Teacher ${n}`, email: `teacher${n}@example.com`, password: PASSWORD, role: 'teacher' });
  const profile = await Teacher.create({ user: user._id, teacherId: `TCH00${n}` });
  return { user, profile, token: await login(user.email) };
};

exports.createStudent = async (n) => {
  const user = await User.create({ name: `Student ${n}`, email: `student${n}@example.com`, password: PASSWORD, role: 'student' });
  const profile = await Student.create({ user: user._id, studentId: `STU00${n}` });
  return { user, profile, token: await login(user.email) };
};