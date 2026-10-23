const Course = require('../models/Course');
const Teacher = require('../models/Teacher');

// Returns the course if the logged-in user may manage it.
// Otherwise it sends the error response itself and returns null.
exports.getManagedCourse = async (req, res, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404).json({ message: 'Course not found' });
    return null;
  }

  if (req.user.role === 'teacher') {
    const teacher = await Teacher.findOne({ user: req.user._id });
    if (!teacher || String(course.teacher) !== String(teacher._id)) {
      res.status(403).json({ message: 'You are not assigned to this course' });
      return null;
    }
  }

  return course; // admins can manage any course
};

// IDs of all courses assigned to the logged-in teacher
exports.getTeacherCourseIds = async (userId) => {
  const teacher = await Teacher.findOne({ user: userId });
  if (!teacher) return [];
  const courses = await Course.find({ teacher: teacher._id }).select('_id');
  return courses.map((c) => c._id);
};