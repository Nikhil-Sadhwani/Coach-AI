export const requireAuth = (req, res, next) => {
  if (!req.session.uid) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
};