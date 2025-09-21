// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(400).json({
      success: false,
      error: 'Duplicate field value entered',
    });
  }

  // Handle Prisma not found error
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Resource not found',
    });
  }

  // Default to 500 server error
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error',
  });
};

// Not found middleware
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
