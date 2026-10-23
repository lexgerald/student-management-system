const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');
const {
  enroll, getEnrollments, getMyEnrollments, unenroll,
} = require('../controllers/enrollmentController');

const router = express.Router();
router.use(protect);

router.get('/my', authorize('student'), getMyEnrollments);

router.route('/')
  .get(authorize('admin'), getEnrollments)
  .post(authorize('admin'), enroll);

router.delete('/:id', authorize('admin'), unenroll);
router.route('/')
  .get(authorize('admin'), getEnrollments)
  .post(authorize('admin'), validate(schemas.enroll), enroll);

module.exports = router;