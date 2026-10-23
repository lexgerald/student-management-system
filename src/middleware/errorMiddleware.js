exports.notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Catches anything not handled inside controllers (bad JSON, oversized body, bugs)
exports.errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body too large' });
  }
  if (process.env.NODE_ENV !== 'test') console.error(err);
  res.status(500).json({
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
};