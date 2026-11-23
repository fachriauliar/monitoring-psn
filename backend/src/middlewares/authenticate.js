const jwt = require("jsonwebtoken");
const { query } = require("../config/database");

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Token autentikasi tidak ditemukan.",
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({
        success: false,
        message: "Token tidak valid atau sudah kedaluwarsa.",
      });
    }

    const result = await query(
      `SELECT id_pengguna, nama_lengkap, email, role, status_akun,
              wajib_ubah_password
       FROM pengguna
       WHERE id_pengguna = $1`,
      [payload.id_pengguna]
    );

    if (!result.rowCount || result.rows[0].status_akun !== "aktif") {
      return res.status(401).json({
        success: false,
        message: "Akun tidak ditemukan atau tidak aktif.",
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = authenticate;
