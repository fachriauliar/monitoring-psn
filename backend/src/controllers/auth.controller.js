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
      `SELECT id_pengguna, nama_lengkap, email, role, status_akun,
              wajib_ubah_password, password_hash
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
        message: "Akun tidak aktif. Hubungi Kasie Kesra.",
      });
    }

    const token = jwt.sign(
      {
        id_pengguna: user.id_pengguna,
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

// Mengambil informasi pengguna yang sedang login
async function me(req, res) {
  return res.json({
    success: true,
    message: "Data sesi pengguna.",
    data: req.user,
  });
}

// Mengubah password pengguna yang sedang login

async function changePassword(req, res, next) {
  try {
    const idPengguna = req.user.id_pengguna;

    const {
      password_lama,
      password_baru,
      konfirmasi_password,
    } = req.body;

    // Validasi konfirmasi password
    if (password_baru !== konfirmasi_password) {
      return res.status(400).json({
        success: false,
        message: "Konfirmasi kata sandi tidak sesuai.",
      });
    }

    // Ambil password dari database
    const result = await query(
      `SELECT id_pengguna, password_hash
       FROM pengguna
       WHERE id_pengguna = $1`,
      [idPengguna]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    // Periksa password lama
    const passwordValid = await bcrypt.compare(
      password_lama,
      user.password_hash
    );

    if (!passwordValid) {
      return res.status(400).json({
        success: false,
        message: "Kata sandi saat ini tidak sesuai.",
      });
    }

    // Pastikan password baru berbeda
    const samePassword = await bcrypt.compare(
      password_baru,
      user.password_hash
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "Kata sandi baru harus berbeda dari sebelumnya.",
      });
    }

    // Hash password baru
    const passwordHash = await bcrypt.hash(password_baru, 12);

    // Update password
    await query(
      `UPDATE pengguna
       SET password_hash = $1,
           wajib_ubah_password = FALSE,
           updated_at = CURRENT_TIMESTAMP
       WHERE id_pengguna = $2`,
      [passwordHash, idPengguna]
    );

    return res.json({
      success: true,
      message: "Kata sandi berhasil diperbarui.",
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
