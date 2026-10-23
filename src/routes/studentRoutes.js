const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');
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

router.route('/')
  .get(authorize('admin', 'teacher'), getStudents)
  .post(authorize('admin'), validate(schemas.createStudent), createStudent);

router.route('/:id')
  .get(authorize('admin', 'teacher'), getStudent)
  .put(authorize('admin'), validate(schemas.updateStudent), updateStudent)
  .delete(authorize('admin'), deleteStudent);

module.exports = router;