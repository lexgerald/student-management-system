const request = require('supertest');
const app = require('../src/app');
const db = require('./db');
const User = require('../src/models/User');

beforeAll(db.connect);
beforeEach(db.clear);
afterAll(db.close);

const valid = { name: 'Jane Doe', email: 'jane@example.com', password: 'Password123' };

describe('Authentication', () => {
  test('registers a student and returns a token', async () => {
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('student');
    expect(res.body.token).toBeDefined();
  });

  test('ignores a role sent by the client', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...valid, role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('student');
  });

  test('stores the password hashed, not as plain text', async () => {
    await request(app).post('/api/auth/register').send(valid);
    const user = await User.findOne({ email: valid.email }).select('+password');
    expect(user.password).not.toBe(valid.password);
    expect(user.password.startsWith('$2')).toBe(true);
  });

  test('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send(valid);
    const res = await request(app).post('/api/auth/register').send(valid);
    expect(res.status).toBe(400);
  });

  test('rejects an invalid email and a weak password', async () => {
    const badEmail = await request(app).post('/api/auth/register').send({ ...valid, email: 'not-an-email' });
    const weak = await request(app).post('/api/auth/register').send({ ...valid, password: 'abc' });
    expect(badEmail.status).toBe(400);
    expect(weak.status).toBe(400);
  });

  test('logs in with the right password and rejects the wrong one', async () => {
    await request(app).post('/api/auth/register').send(valid);
    const ok = await request(app).post('/api/auth/login').send({ email: valid.email, password: valid.password });
    const bad = await request(app).post('/api/auth/login').send({ email: valid.email, password: 'WrongPass1' });
    expect(ok.status).toBe(200);
    expect(bad.status).toBe(401);
  });

  test('blocks NoSQL injection in login', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  test('/me requires a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});