const User = require('../models/User');
const Student = require('../models/Student');
const handleError = require('../utils/handleError');
const Enrollment = require('../models/Enrollment');
const Grade = require('../models/Grade');
const Attendance = require('../models/Attendance');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/students  (admin)
exports.createStudent = async (req, res) => {
  let user;
  try {
    const { name, email, password, studentId, dateOfBirth, gender, className } = req.body;

    if (!name || !email || !password || !studentId) {
      return res.status(400).json({ message: 'Name, email, password and studentId are required' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (await Student.findOne({ studentId })) {
      return res.status(400).json({ message: 'Student ID already exists' });
    }

    user = await User.create({ name, email, password, role: 'student' });
    const student = await Student.create({
      user: user._id, studentId, dateOfBirth, gender, className,
    });

    res.status(201).json(await student.populate('user', 'name email role'));
  } catch (error) {
    if (user) await User.findByIdAndDelete(user._id); // roll back the orphan user
    handleError(res, error);
  }
};

// GET /api/students?page=1&limit=10&search=john&className=Grade5  (admin, teacher)
exports.getStudents = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const { search, className } = req.query;

    const filter = {};
    if (className) filter.className = className;

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      const users = await User.find({ role: 'student', name: regex }).select('_id');
      filter.$or = [
        { user: { $in: users.map((u) => u._id) } },
        { studentId: regex },
      ];
    }

    const [students, total] = await Promise.all([
      Student.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Student.countDocuments(filter),
    ]);

    res.json({ total, page, pages: Math.ceil(total / limit), students });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/students/:id  (admin, teacher)
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('user', 'name email');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /api/students/:id  (admin)
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const { name, email, studentId, dateOfBirth, gender, className } = req.body;

    // Update the login account fields
    const user = await User.findById(student.user);
    if (email && email !== user.email) {
      if (await User.findOne({ email })) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      user.email = email;
    }
    if (name) user.name = name;
    await user.save();

    // Update the profile fields
    if (studentId !== undefined) student.studentId = studentId;
    if (dateOfBirth !== undefined) student.dateOfBirth = dateOfBirth;
    if (gender !== undefined) student.gender = gender;
    if (className !== undefined) student.className = className;
    await student.save();

    res.json(await student.populate('user', 'name email'));
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /api/students/:id  (admin)
exports.deleteStudent = async (req, res) => {
  try {
    await Grade.deleteMany({ student: student._id });
    await Attendance.deleteMany({ student: student._id });
    await Enrollment.deleteMany({ student: student._id });
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    await User.findByIdAndDelete(student.user);
    await student.deleteOne();

    res.json({ message: 'Student deleted' });
  } catch (error) {
    handleError(res, error);
  }
};