const User = require('../models/User');
const Teacher = require('../models/Teacher');
const handleError = require('../utils/handleError');

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// POST /api/teachers
exports.createTeacher = async (req, res) => {
  let user;
  try {
    const { name, email, password, teacherId, department, phone } = req.body;

    if (!name || !email || !password || !teacherId) {
      return res.status(400).json({ message: 'Name, email, password and teacherId are required' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (await Teacher.findOne({ teacherId })) {
      return res.status(400).json({ message: 'Teacher ID already exists' });
    }

    user = await User.create({ name, email, password, role: 'teacher' });
    const teacher = await Teacher.create({
      user: user._id, teacherId, department, phone,
    });

    res.status(201).json(await teacher.populate('user', 'name email role'));
  } catch (error) {
    if (user) await User.findByIdAndDelete(user._id);
    handleError(res, error);
  }
};

// GET /api/teachers?page=1&limit=10&search=...&department=...
exports.getTeachers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const { search, department } = req.query;

    const filter = {};
    if (department) filter.department = department;

    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      const users = await User.find({ role: 'teacher', name: regex }).select('_id');
      filter.$or = [
        { user: { $in: users.map((u) => u._id) } },
        { teacherId: regex },
      ];
    }

    const [teachers, total] = await Promise.all([
      Teacher.find(filter)
        .populate('user', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Teacher.countDocuments(filter),
    ]);

    res.json({ total, page, pages: Math.ceil(total / limit), teachers });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /api/teachers/:id
exports.getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id).populate('user', 'name email');
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.json(teacher);
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /api/teachers/:id
exports.updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    const { name, email, teacherId, department, phone } = req.body;

    const user = await User.findById(teacher.user);
    if (email && email !== user.email) {
      if (await User.findOne({ email })) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      user.email = email;
    }
    if (name) user.name = name;
    await user.save();

    if (teacherId !== undefined) teacher.teacherId = teacherId;
    if (department !== undefined) teacher.department = department;
    if (phone !== undefined) teacher.phone = phone;
    await teacher.save();

    res.json(await teacher.populate('user', 'name email'));
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /api/teachers/:id
exports.deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    await User.findByIdAndDelete(teacher.user);
    await teacher.deleteOne();

    res.json({ message: 'Teacher deleted' });
  } catch (error) {
    handleError(res, error);
  }
};