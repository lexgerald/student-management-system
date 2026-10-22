const handleError = (res, error) => {
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || 'field';
    return res.status(400).json({ message: `Duplicate value for ${field}` });
  }
  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }
  res.status(500).json({ message: error.message });
};

module.exports = handleError;