const express = require('express');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  markAttendance, getAttendance, getMyAttendance,
} = require('../controllers/attendanceController');

const router = express.Router();
router.use(protect);

router.get('/my', authorize('student'), getMyAttendance);

router.route('/')
  .get(authorize('admin', 'teacher'), getAttendance)
  .post(authorize('admin', 'teacher'), markAttendance);

router.route('/')
  .get(authorize('admin', 'teacher'), getAttendance)
  .post(authorize('admin', 'teacher'), validate(schemas.markAttendance), markAttendance);

module.exports = router;