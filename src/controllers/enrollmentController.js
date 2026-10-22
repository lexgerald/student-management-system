const Enrollment = require('../models/Enrollment');
const Student = require('../models/Student');
const Course = require('../models/Course');
const handleError = require('../utils/handleError');

// POST /api/enrollments  (admin)  body: { student, course, academicYear }
exports.enroll = async (req, res) => {
  try {
    const { student, course, academicYear } = req.body;

    if (!student || !course || !academicYear) {
      return res.status(400).json({ message: 'student, course and academicYear are required' });
    }
    if (!(await Student.findById(student))) {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (!(await Course.findById(course))) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // The unique index from Week 2 blocks duplicates; handleError turns it into a 400
    const enrollment = await Enrollment.create({ student, course, academicYear });
    res.status(201).json(enrollment);
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/enrollments?student=<id>&course=<id>&academicYear=2026  (admin)
exports.getEnrollments = async (req, res) => {
  try {
    const filter = {};
    ['student', 'course', 'academicYear'].forEach((key) => {
      if (req.query[key]) filter[key] = req.query[key];
    });

    const enrollments = await Enrollment.find(filter)
      .populate({
        path: 'student',
        select: 'studentId className user',
        populate: { path: 'user', select: 'name' },
      })
      .populate('course', 'name code credits')
      .sort({ createdAt: -1 });

    res.json({ total: enrollments.length, enrollments });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/enrollments/my  (student) - the logged-in student's own courses
exports.getMyEnrollments = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const enrollments = await Enrollment.find({ student: student._id }).populate({
      path: 'course',
      select: 'name code credits teacher',
      populate: { path: 'teacher', select: 'user', populate: { path: 'user', select: 'name' } },
    });

    res.json({ total: enrollments.length, enrollments });
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /api/enrollments/:id  (admin)
exports.unenroll = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found' });
    res.json({ message: 'Student unenrolled' });
  } catch (error) {
    handleError(res, error);
  }
};