const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { query } = require("../config/database");

async function login(req, res, next) {
  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email dan password wajib diisi.",
      });
    }

    const result = await query(
      `SELECT
        id_pengguna,
        nama_lengkap,
        email,
        role,
        status_akun,
        wajib_ubah_password,
        password_hash
       FROM pengguna
       WHERE LOWER(email) = LOWER($1)`,
      [email],
    );

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({
        success: false,
        message: "Email atau password tidak sesuai.",
      });
    }

    if (user.status_akun !== "aktif") {
      return res.status(403).json({
        success: false,
        message: "Akun tidak aktif. Hubungi Superadmin.",
      });
    }

    if (!["admin", "superadmin"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Role akun tidak memiliki akses.",
      });
    }

    const token = jwt.sign(
      {
        id_pengguna: user.id_pengguna,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d",
      },
    );

    delete user.password_hash;

    return res.json({
      success: true,
      message: "Login berhasil.",
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

// =========================================================
// MENGAMBIL DATA PENGGUNA YANG SEDANG LOGIN
// =========================================================

async function me(req, res) {
  return res.json({
    success: true,
    message: "Data sesi pengguna.",
    data: req.user,
  });
}

// =========================================================
// MENGUBAH PASSWORD PENGGUNA
// =========================================================

async function changePassword(req, res, next) {
  try {
    const idPengguna = req.user.id_pengguna;

    const passwordLama = String(req.body.password_lama || "");
    const passwordBaru = String(req.body.password_baru || "");
    const konfirmasiPassword = String(req.body.konfirmasi_password || "");

    if (!passwordLama || !passwordBaru || !konfirmasiPassword) {
      return res.status(400).json({
        success: false,
        message: "Semua kolom password wajib diisi.",
      });
    }

    if (passwordBaru.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 8 karakter.",
      });
    }

    if (passwordBaru !== konfirmasiPassword) {
      return res.status(400).json({
        success: false,
        message: "Konfirmasi password tidak sesuai.",
      });
    }

    const result = await query(
      `SELECT password_hash
       FROM pengguna
       WHERE id_pengguna = $1`,
      [idPengguna],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    const passwordValid = await bcrypt.compare(
      passwordLama,
      result.rows[0].password_hash,
    );

    if (!passwordValid) {
      return res.status(400).json({
        success: false,
        message: "Password lama tidak sesuai.",
      });
    }

    const samePassword = await bcrypt.compare(
      passwordBaru,
      result.rows[0].password_hash,
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "Password baru harus berbeda dari password lama.",
      });
    }

    const rounds = Number(process.env.BCRYPT_ROUNDS || 12);

    const passwordHash = await bcrypt.hash(passwordBaru, rounds);

    await query(
      `UPDATE pengguna
       SET password_hash = $1,
           wajib_ubah_password = FALSE,
           updated_at = NOW()
       WHERE id_pengguna = $2`,
      [passwordHash, idPengguna],
    );

    return res.json({
      success: true,
      message: "Password berhasil diperbarui.",
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  me,
  changePassword,
};
