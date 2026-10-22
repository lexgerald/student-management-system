const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createCourse, getCourses, getMyCourses, getCourse,
  updateCourse, assignTeacher, deleteCourse, getCourseStudents,
} = require('../controllers/courseController');

const router = express.Router();
router.use(protect);

// '/my' must come BEFORE '/:id', otherwise "my" is treated as an id
router.get('/my', authorize('teacher'), getMyCourses);

router.route('/')
  .get(authorize('admin', 'teacher'), getCourses)
  .post(authorize('admin'), createCourse);

router.route('/:id')
  .get(authorize('admin', 'teacher'), getCourse)
  .put(authorize('admin'), updateCourse)
  .delete(authorize('admin'), deleteCourse);

router.put('/:id/teacher', authorize('admin'), assignTeacher);
router.get('/:id/students', authorize('admin', 'teacher'), getCourseStudents);

module.exports = router;