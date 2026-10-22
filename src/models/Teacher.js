const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    teacherId: { type: String, required: true, unique: true },
    department: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Teacher', teacherSchema);