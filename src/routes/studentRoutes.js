const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createStudent, getStudents, getStudent, updateStudent, deleteStudent,
} = require('../controllers/studentController');

const router = express.Router();
router.use(protect);

router.route('/')
  .get(authorize('admin', 'teacher'), getStudents)
  .post(authorize('admin'), createStudent);

router.route('/:id')
  .get(authorize('admin', 'teacher'), getStudent)
  .put(authorize('admin'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

module.exports = router;