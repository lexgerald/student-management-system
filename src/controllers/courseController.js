const Course = require('../models/Course');
const Teacher = require('../models/Teacher');
const Enrollment = require('../models/Enrollment');
const handleError = require('../utils/handleError');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Reusable populate: course -> teacher -> user (for the teacher's name)
const teacherPopulate = {
  path: 'teacher',
  select: 'teacherId department user',
  populate: { path: 'user', select: 'name email' },
};

// POST /api/courses  (admin)
exports.createCourse = async (req, res) => {
  try {
    const { name, code, description, credits, teacher } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }
    if (teacher && !(await Teacher.findById(teacher))) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const course = await Course.create({ name, code, description, credits, teacher });
    res.status(201).json(await course.populate(teacherPopulate));
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/courses?page=1&limit=10&search=prog  (admin, teacher)
exports.getCourses = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const { search } = req.query;

    const filter = {};
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: regex }, { code: regex }];
    }

    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate(teacherPopulate)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Course.countDocuments(filter),
    ]);

    res.json({ total, page, pages: Math.ceil(total / limit), courses });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/courses/my  (teacher) - courses assigned to the logged-in teacher
exports.getMyCourses = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

    const courses = await Course.find({ teacher: teacher._id });
    res.json(courses);
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/courses/:id  (admin, teacher)
exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(teacherPopulate);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /api/courses/:id  (admin)
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const { name, code, description, credits } = req.body;
    if (name !== undefined) course.name = name;
    if (code !== undefined) course.code = code;
    if (description !== undefined) course.description = description;
    if (credits !== undefined) course.credits = credits;
    await course.save();

    res.json(await course.populate(teacherPopulate));
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /api/courses/:id/teacher  (admin)  body: { "teacher": "<teacherId or null>" }
exports.assignTeacher = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const { teacher } = req.body;
    if (teacher) {
      if (!(await Teacher.findById(teacher))) {
        return res.status(404).json({ message: 'Teacher not found' });
      }
      course.teacher = teacher;
    } else {
      course.teacher = undefined; // unassign
    }
    await course.save();

    res.json(await course.populate(teacherPopulate));
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /api/courses/:id  (admin)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    await Grade.deleteMany({ course: course._id });
    await Attendance.deleteMany({ course: course._id });
    await Enrollment.deleteMany({ course: course._id }); // clean up enrollments
    await course.deleteOne();

    res.json({ message: 'Course deleted' });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/courses/:id/students  (admin, or the teacher assigned to the course)
exports.getCourseStudents = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    if (req.user.role === 'teacher') {
      const teacher = await Teacher.findOne({ user: req.user._id });
      if (!teacher || String(course.teacher) !== String(teacher._id)) {
        return res.status(403).json({ message: 'You are not assigned to this course' });
      }
    }

    const filter = { course: course._id };
    if (req.query.academicYear) filter.academicYear = req.query.academicYear;

    const enrollments = await Enrollment.find(filter).populate({
      path: 'student',
      select: 'studentId className user',
      populate: { path: 'user', select: 'name email' },
    });

    res.json({ course: course.code, total: enrollments.length, enrollments });
  } catch (error) {
    handleError(res, error);
  }
};