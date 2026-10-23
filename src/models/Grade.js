const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    term: { type: String, required: true, trim: true }, // e.g. "Term 1", "Midterm"
    score: { type: Number, required: true, min: 0, max: 100 },
    remarks: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// One grade per student, per course, per term
gradeSchema.index({ student: 1, course: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);