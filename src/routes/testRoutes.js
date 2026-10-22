const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  res.json({ message: `Welcome admin ${req.user.name}` });
});

router.get('/teacher-or-admin', protect, authorize('teacher', 'admin'), (req, res) => {
  res.json({ message: `Welcome ${req.user.role} ${req.user.name}` });
});

module.exports = router;