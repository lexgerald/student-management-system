const request = require('supertest');
const app = require('../src/app');
const db = require('./db');
const { createAdmin, createTeacher, createStudent, login, PASSWORD } = require('./helpers');
const Course = require('../src/models/Course');
const Enrollment = require('../src/models/Enrollment');

beforeAll(db.connect);
afterAll(db.close);

let admin, teacherA, teacherB, student, outsider, course;

beforeEach(async () => {
  await db.clear();
  admin = await createAdmin();
  teacherA = await createTeacher(1);
  teacherB = await createTeacher(2);
  student = await createStudent(1);
  outsider = await createStudent(2); // not enrolled anywhere
  course = await Course.create({ name: 'Intro', code: 'CS101', teacher: teacherA.profile._id });
  await Enrollment.create({ student: student.profile._id, course: course._id, academicYear: '2026' });
});

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const gradeBody = (over = {}) => ({
  student: String(student.profile._id),
  course: String(course._id),
  term: 'Term 1',
  score: 85,
  ...over,
});
const postGrade = (token, body) => request(app).post('/api/grades').set(auth(token)).send(body);

describe('Grades: ownership and validation', () => {
  test('the assigned teacher can record a grade', async () => {
    const res = await postGrade(teacherA.token, gradeBody());
    expect(res.status).toBe(201);
  });

  test('a different teacher is blocked', async () => {
    const res = await postGrade(teacherB.token, gradeBody());
    expect(res.status).toBe(403);
  });

  test('a student who is not enrolled is rejected', async () => {
    const res = await postGrade(teacherA.token, gradeBody({ student: String(outsider.profile._id) }));
    expect(res.status).toBe(400);
  });

  test('a score above 100 is rejected by validation', async () => {
    const res = await postGrade(teacherA.token, gradeBody({ score: 150 }));
    expect(res.status).toBe(400);
  });

  test('a duplicate grade for the same term is rejected', async () => {
    await postGrade(teacherA.token, gradeBody());
    const res = await postGrade(teacherA.token, gradeBody());
    expect(res.status).toBe(400);
  });

  test('a student cannot record grades', async () => {
    const res = await postGrade(student.token, gradeBody());
    expect(res.status).toBe(403);
  });

  test('a student sees only their own grades, with average and letter', async () => {
    await postGrade(teacherA.token, gradeBody({ term: 'Term 1', score: 80 }));
    await postGrade(teacherA.token, gradeBody({ term: 'Term 2', score: 90 }));
    const res = await request(app).get('/api/grades/my').set(auth(student.token));
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.average).toBe(85);
    expect(res.body.grades.every((g) => g.letter)).toBe(true);

    const other = await request(app).get('/api/grades/my').set(auth(outsider.token));
    expect(other.body.total).toBe(0);
  });
});

describe('Role-based access', () => {
  test('a student cannot list students, but a teacher can', async () => {
    const asStudent = await request(app).get('/api/students').set(auth(student.token));
    const asTeacher = await request(app).get('/api/students').set(auth(teacherA.token));
    expect(asStudent.status).toBe(403);
    expect(asTeacher.status).toBe(200);
  });

  test('an admin can create a student who can then log in', async () => {
    const res = await request(app).post('/api/students').set(auth(admin)).send({
      name: 'New Student', email: 'new@example.com', password: PASSWORD, studentId: 'STU999',
    });
    expect(res.status).toBe(201);
    expect(await login('new@example.com')).toBeDefined();
  });

  test('unknown routes return a JSON 404', async () => {
    const res = await request(app).get('/api/nothing-here');
    expect(res.status).toBe(404);
  });
});