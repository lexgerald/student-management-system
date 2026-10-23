const express = require('express');
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

module.exports = router;