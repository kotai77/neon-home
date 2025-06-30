export function loggingMiddleware(logger) {
  return (req, res, next) => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      logger.info("Request completed", {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      });
    });

    next();
  };
}
