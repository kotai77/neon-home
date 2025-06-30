export function validateRequest(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: result.error.errors,
        });
      }
      req.body = result.data;
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: "Invalid request data",
        message: error.message,
      });
    }
  };
}
