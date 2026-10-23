const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validate');
const schemas = require('../validators/schemas');
const {
  createGrade, getGrades, updateGrade, deleteGrade, getMyGrades,
} = require('../controllers/gradeController');

const router = express.Router();
router.use(protect);

router.get('/my', authorize('student'), getMyGrades); // before '/:id'

router.route('/')
  .get(authorize('admin', 'teacher'), getGrades)
  .post(authorize('admin', 'teacher'), createGrade);

router.route('/:id')
  .put(authorize('admin', 'teacher'), updateGrade)
  .delete(authorize('admin', 'teacher'), deleteGrade);

router.route('/')
  .get(authorize('admin', 'teacher'), getGrades)
  .post(authorize('admin', 'teacher'), validate(schemas.createGrade), createGrade);

router.route('/:id')
  .put(authorize('admin', 'teacher'), validate(schemas.updateGrade), updateGrade)
  .delete(authorize('admin', 'teacher'), deleteGrade);

module.exports = router;