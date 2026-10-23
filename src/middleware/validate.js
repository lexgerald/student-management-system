// Validates req.body against a Joi schema.
// stripUnknown removes unexpected fields (e.g. someone sending "role": "admin" when registering).
exports.validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body || {}, {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }
  req.body = value;
  next();
};