// [method, path, tag, summary, access, example body]
const endpoints = [
  ['post', '/api/auth/register', 'Auth', 'Register a student account', 'Public', { name: 'Jane Doe', email: 'jane@example.com', password: 'Password123' }],
  ['post', '/api/auth/login', 'Auth', 'Log in and receive a JWT', 'Public', { email: 'admin@sms.com', password: 'Admin@123' }],
  ['get', '/api/auth/me', 'Auth', 'Get the logged-in user', 'Any logged-in user'],

  ['post', '/api/students', 'Students', 'Create a student (account + profile)', 'Admin', { name: 'John Smith', email: 'john@example.com', password: 'Password123', studentId: 'STU001', className: 'Grade 5', gender: 'male' }],
  ['get', '/api/students', 'Students', 'List students (query: page, limit, search, className)', 'Admin, Teacher'],
  ['get', '/api/students/{id}', 'Students', 'Get one student', 'Admin, Teacher'],
  ['put', '/api/students/{id}', 'Students', 'Update a student', 'Admin', { className: 'Grade 6' }],
  ['delete', '/api/students/{id}', 'Students', 'Delete a student and related data', 'Admin'],

  ['post', '/api/teachers', 'Teachers', 'Create a teacher (account + profile)', 'Admin', { name: 'Mary Jones', email: 'mary@example.com', password: 'Password123', teacherId: 'TCH001', department: 'Science' }],
  ['get', '/api/teachers', 'Teachers', 'List teachers (query: page, limit, search, department)', 'Admin'],
  ['get', '/api/teachers/{id}', 'Teachers', 'Get one teacher', 'Admin'],
  ['put', '/api/teachers/{id}', 'Teachers', 'Update a teacher', 'Admin', { department: 'Mathematics' }],
  ['delete', '/api/teachers/{id}', 'Teachers', 'Delete a teacher', 'Admin'],

  ['post', '/api/courses', 'Courses', 'Create a course', 'Admin', { name: 'Introduction to Programming', code: 'CS101', credits: 3 }],
  ['get', '/api/courses', 'Courses', 'List courses (query: page, limit, search)', 'Admin, Teacher'],
  ['get', '/api/courses/my', 'Courses', 'Courses assigned to me', 'Teacher'],
  ['get', '/api/courses/{id}', 'Courses', 'Get one course', 'Admin, Teacher'],
  ['put', '/api/courses/{id}', 'Courses', 'Update a course', 'Admin', { credits: 4 }],
  ['delete', '/api/courses/{id}', 'Courses', 'Delete a course and related data', 'Admin'],
  ['put', '/api/courses/{id}/teacher', 'Courses', 'Assign (or unassign with null) a teacher', 'Admin', { teacher: '<teacher profile id>' }],
  ['get', '/api/courses/{id}/students', 'Courses', 'Students enrolled in a course', 'Admin, assigned Teacher'],

  ['post', '/api/enrollments', 'Enrollments', 'Enroll a student in a course', 'Admin', { student: '<student profile id>', course: '<course id>', academicYear: '2026' }],
  ['get', '/api/enrollments', 'Enrollments', 'List enrollments (query: student, course, academicYear)', 'Admin'],
  ['get', '/api/enrollments/my', 'Enrollments', 'My enrolled courses', 'Student'],
  ['delete', '/api/enrollments/{id}', 'Enrollments', 'Unenroll a student', 'Admin'],

  ['post', '/api/grades', 'Grades', 'Record a grade', 'Admin, assigned Teacher', { student: '<student profile id>', course: '<course id>', term: 'Term 1', score: 85, remarks: 'Good work' }],
  ['get', '/api/grades', 'Grades', 'List grades (query: course, student, term)', 'Admin, Teacher'],
  ['get', '/api/grades/my', 'Grades', 'My grades with letter grades and average', 'Student'],
  ['put', '/api/grades/{id}', 'Grades', 'Update a grade', 'Admin, assigned Teacher', { score: 90 }],
  ['delete', '/api/grades/{id}', 'Grades', 'Delete a grade', 'Admin, assigned Teacher'],

  ['post', '/api/attendance', 'Attendance', 'Mark attendance for a class (re-sending updates it)', 'Admin, assigned Teacher', { course: '<course id>', date: '2026-10-23', records: [{ student: '<student profile id>', status: 'present' }] }],
  ['get', '/api/attendance', 'Attendance', 'View attendance (query: course [required], date, student)', 'Admin, assigned Teacher'],
  ['get', '/api/attendance/my', 'Attendance', 'My attendance with percentage summary (query: course)', 'Student'],
];

const paths = {};
for (const [method, path, tag, summary, access, body] of endpoints) {
  const parameters = [...path.matchAll(/\{(\w+)\}/g)].map((m) => ({
    name: m[1], in: 'path', required: true, schema: { type: 'string' },
  }));
  paths[path] = paths[path] || {};
  paths[path][method] = {
    tags: [tag],
    summary,
    description: `**Access:** ${access}`,
    security: access === 'Public' ? [] : [{ bearerAuth: [] }],
    parameters,
    ...(body && {
      requestBody: {
        required: true,
        content: { 'application/json': { schema: { type: 'object' }, example: body } },
      },
    }),
    responses: {
      200: { description: 'Success' },
      400: { description: 'Validation error' },
      401: { description: 'Not authenticated' },
      403: { description: 'Role not allowed' },
      404: { description: 'Not found' },
    },
  };
}

module.exports = {
  openapi: '3.0.3',
  info: { title: 'Student Management System API', version: '1.0.0' },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
  },
  paths,
};