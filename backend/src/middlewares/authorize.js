function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak memiliki hak akses untuk melakukan tindakan ini.",
      });
    }
    next();
  };
}

module.exports = authorize;
