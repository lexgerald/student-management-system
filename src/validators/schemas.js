const Joi = require('joi');

const id = Joi.string().hex().length(24); // MongoDB ObjectId
const email = Joi.string().trim().lowercase().email({ tlds: { allow: false } });
const name = Joi.string().trim().min(2).max(100);
// max 72 because bcrypt ignores everything after 72 bytes
const password = Joi.string().min(8).max(72).pattern(/[A-Za-z]/).pattern(/\d/)
  .messages({ 'string.pattern.base': 'Password must contain at least one letter and one number' });
const phone = Joi.string().pattern(/^[0-9+\-\s()]{7,20}$/);

// ---------- Auth ----------
exports.register = Joi.object({ name: name.required(), email: email.required(), password: password.required() });
exports.login = Joi.object({ email: email.required(), password: Joi.string().required() });

// ---------- Students ----------
const studentFields = {
  name, email,
  studentId: Joi.string().trim().max(30),
  dateOfBirth: Joi.date().max('now'),
  gender: Joi.string().valid('male', 'female', 'other'),
  className: Joi.string().trim().max(50),
};
exports.createStudent = Joi.object({
  ...studentFields,
  name: name.required(), email: email.required(), password: password.required(),
  studentId: studentFields.studentId.required(),
});
exports.updateStudent = Joi.object(studentFields).min(1);

// ---------- Teachers ----------
const teacherFields = {
  name, email,
  teacherId: Joi.string().trim().max(30),
  department: Joi.string().trim().max(100),
  phone,
};
exports.createTeacher = Joi.object({
  ...teacherFields,
  name: name.required(), email: email.required(), password: password.required(),
  teacherId: teacherFields.teacherId.required(),
});
exports.updateTeacher = Joi.object(teacherFields).min(1);

// ---------- Courses ----------
const courseFields = {
  name: Joi.string().trim().min(2).max(150),
  code: Joi.string().trim().uppercase().max(20),
  description: Joi.string().trim().max(500).allow(''),
  credits: Joi.number().integer().min(1).max(10),
};
exports.createCourse = Joi.object({
  ...courseFields,
  name: courseFields.name.required(),
  code: courseFields.code.required(),
  teacher: id,
});
exports.updateCourse = Joi.object(courseFields).min(1);
exports.assignTeacher = Joi.object({ teacher: id.allow(null).required() }); // null = unassign

// ---------- Enrollment ----------
exports.enroll = Joi.object({
  student: id.required(),
  course: id.required(),
  academicYear: Joi.string().pattern(/^\d{4}(-\d{4})?$/).required()
    .messages({ 'string.pattern.base': 'academicYear must look like 2026 or 2026-2027' }),
});

// ---------- Grades ----------
exports.createGrade = Joi.object({
  student: id.required(),
  course: id.required(),
  term: Joi.string().trim().max(50).required(),
  score: Joi.number().min(0).max(100).required(),
  remarks: Joi.string().trim().max(300).allow(''),
});
exports.updateGrade = Joi.object({
  term: Joi.string().trim().max(50),
  score: Joi.number().min(0).max(100),
  remarks: Joi.string().trim().max(300).allow(''),
}).min(1);

// ---------- Attendance ----------
exports.markAttendance = Joi.object({
  course: id.required(),
  date: Joi.date().iso().required(),
  records: Joi.array().min(1).max(500).items(
    Joi.object({
      student: id.required(),
      status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
    })
  ).required(),
});