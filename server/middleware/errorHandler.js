export function errorHandler(logger) {
  return (err, req, res, next) => {
    logger.error("Unhandled error", {
      error: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
    });

    res.status(err.status || 500).json({
      success: false,
      error: "Internal server error",
      message:
        process.env.NODE_ENV === "development"
          ? err.message
          : "Something went wrong",
    });
  };
}
