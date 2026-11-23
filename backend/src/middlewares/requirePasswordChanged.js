function requirePasswordChanged(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Silakan login terlebih dahulu.",
    });
  }

  if (req.user.wajib_ubah_password) {
    return res.status(403).json({
      success: false,
      code: "PASSWORD_CHANGE_REQUIRED",
      message: "Silakan ubah password awal sebelum mengakses fitur lainnya.",
    });
  }

  next();
}

module.exports = requirePasswordChanged;
