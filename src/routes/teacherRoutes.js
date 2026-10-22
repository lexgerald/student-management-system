const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  createTeacher, getTeachers, getTeacher, updateTeacher, deleteTeacher,
} = require('../controllers/teacherController');

const router = express.Router();
router.use(protect, authorize('admin'));

router.route('/').get(getTeachers).post(createTeacher);
router.route('/:id').get(getTeacher).put(updateTeacher).delete(deleteTeacher);

module.exports = router;