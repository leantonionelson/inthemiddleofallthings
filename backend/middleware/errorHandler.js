const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // Stripe errors
  if (err.type && err.type.startsWith('Stripe')) {
    error.message = err.message || 'Payment processing error';
    error.status = 400;
  }

  // Validation errors
  if (err.isJoi) {
    error.message = err.details[0].message;
    error.status = 400;
  }

  // Firebase errors
  if (err.code && err.code.startsWith('auth/')) {
    error.message = 'Authentication error';
    error.status = 401;
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    if (error.status === 500) {
      error.message = 'Internal Server Error';
    }
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };
