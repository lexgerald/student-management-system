const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');
const {
  createTeacher, getTeachers, getTeacher, updateTeacher, deleteTeacher,
} = require('../controllers/teacherController');

const router = express.Router();
router.use(protect, authorize('admin'));

router.route('/').get(getTeachers).post(validate(schemas.createTeacher), createTeacher);
router.route('/:id').get(getTeacher).put(validate(schemas.updateTeacher), updateTeacher).delete(deleteTeacher);

module.exports = router;