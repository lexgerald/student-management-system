const Grade = require('../models/Grade');
const Student = require('../models/Student');
const Enrollment = require('../models/Enrollment');
const handleError = require('../utils/handleError');
const { getManagedCourse, getTeacherCourseIds } = require('../utils/courseAccess');

// Change these boundaries to match your school's grading scale
const letterGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

const gradePopulate = [
  { path: 'student', select: 'studentId className user', populate: { path: 'user', select: 'name' } },
  { path: 'course', select: 'name code' },
];

// POST /api/grades  (admin, teacher)  body: { student, course, term, score, remarks }
exports.createGrade = async (req, res) => {
  try {
    const { student, course, term, score, remarks } = req.body;

    if (!student || !course || !term || score === undefined) {
      return res.status(400).json({ message: 'student, course, term and score are required' });
    }

    const managedCourse = await getManagedCourse(req, res, course);
    if (!managedCourse) return; // response already sent

    if (!(await Student.findById(student))) {
      return res.status(404).json({ message: 'Student not found' });
    }
    if (!(await Enrollment.findOne({ student, course }))) {
      return res.status(400).json({ message: 'Student is not enrolled in this course' });
    }

    const grade = await Grade.create({
      student, course, term, score, remarks, recordedBy: req.user._id,
    });
    res.status(201).json(await grade.populate(gradePopulate));
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/grades?course=<id>&student=<id>&term=Term 1  (admin, teacher)
exports.getGrades = async (req, res) => {
  try {
    const { course, student, term } = req.query;
    const filter = {};
    if (student) filter.student = student;
    if (term) filter.term = term;

    if (req.user.role === 'teacher') {
      if (course) {
        const managed = await getManagedCourse(req, res, course);
        if (!managed) return;
        filter.course = course;
      } else {
        // no course given: show grades for all of this teacher's courses
        filter.course = { $in: await getTeacherCourseIds(req.user._id) };
      }
    } else if (course) {
      filter.course = course;
    }

    const grades = await Grade.find(filter).populate(gradePopulate).sort({ createdAt: -1 });
    res.json({ total: grades.length, grades });
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /api/grades/:id  (admin, teacher)
exports.updateGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });

    const managed = await getManagedCourse(req, res, grade.course);
    if (!managed) return;

    const { term, score, remarks } = req.body;
    if (term !== undefined) grade.term = term;
    if (score !== undefined) grade.score = score;
    if (remarks !== undefined) grade.remarks = remarks;
    await grade.save();

    res.json(await grade.populate(gradePopulate));
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /api/grades/:id  (admin, teacher)
exports.deleteGrade = async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });

    const managed = await getManagedCourse(req, res, grade.course);
    if (!managed) return;

    await grade.deleteOne();
    res.json({ message: 'Grade deleted' });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/grades/my  (student)
exports.getMyGrades = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const grades = await Grade.find({ student: student._id })
      .populate('course', 'name code credits')
      .sort({ createdAt: -1 });

    const average = grades.length
      ? Math.round((grades.reduce((sum, g) => sum + g.score, 0) / grades.length) * 100) / 100
      : null;

    res.json({
      total: grades.length,
      average,
      grades: grades.map((g) => ({ ...g.toObject(), letter: letterGrade(g.score) })),
    });
  } catch (error) {
    handleError(res, error);
  }
};