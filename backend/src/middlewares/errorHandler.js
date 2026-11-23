function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan.`,
  });
}

function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) return next(error);

  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Data sudah digunakan. Periksa email atau NIP.",
    });
  }

  if (error.code === "23503" || error.code === "23514" || error.code === "22P02") {
    return res.status(400).json({
      success: false,
      message: "Data yang dikirim tidak valid.",
    });
  }

  res.status(500).json({
    success: false,
    message: "Terjadi kesalahan pada server.",
  });
}

module.exports = { notFound, errorHandler };
