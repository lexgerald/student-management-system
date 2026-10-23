const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const handleError = require('../utils/handleError');
const { getManagedCourse } = require('../utils/courseAccess');

const STATUSES = ['present', 'absent', 'late', 'excused'];

// Turn "2026-10-23" into midnight UTC so one day = one date value
const normalizeDate = (value) => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// POST /api/attendance  (admin, teacher)
// body: { course, date, records: [{ student, status }, ...] }
exports.markAttendance = async (req, res) => {
  try {
    const { course, date, records } = req.body;

    if (!course || !date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ message: 'course, date and a non-empty records array are required' });
    }

    const day = normalizeDate(date);
    if (!day) return res.status(400).json({ message: 'Invalid date' });

    if (records.some((r) => !r.student || !STATUSES.includes(r.status))) {
      return res.status(400).json({
        message: `Each record needs a student and a status (${STATUSES.join(', ')})`,
      });
    }

    const managed = await getManagedCourse(req, res, course);
    if (!managed) return;

    // Every student must be enrolled in this course
    const studentIds = [...new Set(records.map((r) => String(r.student)))];
    const enrolled = await Enrollment.find({ course, student: { $in: studentIds } }).select('student');
    const enrolledIds = new Set(enrolled.map((e) => String(e.student)));
    const notEnrolled = studentIds.filter((id) => !enrolledIds.has(id));
    if (notEnrolled.length) {
      return res.status(400).json({ message: 'Some students are not enrolled in this course', notEnrolled });
    }

    await Attendance.bulkWrite(
      records.map((r) => ({
        updateOne: {
          filter: { student: r.student, course, date: day },
          update: { $set: { status: r.status, markedBy: req.user._id } },
          upsert: true,
        },
      }))
    );

    res.status(201).json({
      message: 'Attendance saved',
      date: day.toISOString().slice(0, 10),
      count: records.length,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/attendance?course=<id>&date=2026-10-23&student=<id>  (admin, teacher)
exports.getAttendance = async (req, res) => {
  try {
    const { course, date, student } = req.query;
    if (!course) return res.status(400).json({ message: 'course query parameter is required' });

    const managed = await getManagedCourse(req, res, course);
    if (!managed) return;

    const filter = { course };
    if (student) filter.student = student;
    if (date) {
      const day = normalizeDate(date);
      if (!day) return res.status(400).json({ message: 'Invalid date' });
      filter.date = day;
    }

    const records = await Attendance.find(filter)
      .populate({ path: 'student', select: 'studentId user', populate: { path: 'user', select: 'name' } })
      .sort({ date: -1 });

    res.json({ total: records.length, records });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/attendance/my?course=<id>  (student)
exports.getMyAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const filter = { student: student._id };
    if (req.query.course) filter.course = req.query.course;

    const records = await Attendance.find(filter)
      .populate('course', 'name code')
      .sort({ date: -1 });

    // Summary per course. "Attended" = present + late.
    const summary = {};
    records.forEach((r) => {
      const key = r.course.code;
      if (!summary[key]) {
        summary[key] = { course: r.course.name, total: 0, present: 0, late: 0, absent: 0, excused: 0 };
      }
      summary[key].total += 1;
      summary[key][r.status] += 1;
    });
    Object.values(summary).forEach((s) => {
      s.attendancePercent = Math.round(((s.present + s.late) / s.total) * 100);
    });

    res.json({ total: records.length, summary, records });
  } catch (error) {
    handleError(res, error);
  }
};