const bcrypt = require("bcrypt");
const { query } = require("../config/database");

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

function isValidBcryptRounds() {
  return (
    Number.isInteger(BCRYPT_ROUNDS) &&
    BCRYPT_ROUNDS >= 10 &&
    BCRYPT_ROUNDS <= 15
  );
}

function profileColumns() {
  return `
    id_pengguna,
    nama_lengkap,
    nip,
    email,
    no_hp,
    jabatan,
    bagian,
    pangkat_golongan,
    role,
    status_akun,
    wajib_ubah_password,
    created_at,
    updated_at
  `;
}

// =========================================================
// 1. GET PROFILE
// GET /api/profile
// =========================================================

async function getProfile(req, res, next) {
  try {
    const result = await query(
      `SELECT ${profileColumns()}
       FROM pengguna
       WHERE id_pengguna = $1`,
      [req.user.id_pengguna],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Profil pengguna tidak ditemukan.",
      });
    }

    return res.json({
      success: true,
      message: "Profil berhasil diambil.",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

// =========================================================
// 2. UPDATE PROFILE
// PUT /api/profile
// =========================================================

async function updateProfile(req, res, next) {
  try {
    const {
      nama_lengkap,
      nip,
      email,
      no_hp,
      jabatan,
      bagian,
      pangkat_golongan,
    } = req.body;

    const normalizedEmail = String(email).trim().toLowerCase();

    const result = await query(
      `UPDATE pengguna
       SET
         nama_lengkap = $1,
         nip = NULLIF($2, ''),
         email = $3,
         no_hp = NULLIF($4, ''),
         jabatan = NULLIF($5, ''),
         bagian = NULLIF($6, ''),
         pangkat_golongan = NULLIF($7, ''),
         updated_at = NOW()
       WHERE id_pengguna = $8
       RETURNING ${profileColumns()}`,
      [
        nama_lengkap.trim(),
        String(nip || "").trim(),
        normalizedEmail,
        String(no_hp || "").trim(),
        String(jabatan || "").trim(),
        String(bagian || "").trim(),
        String(pangkat_golongan || "").trim(),
        req.user.id_pengguna,
      ],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Profil pengguna tidak ditemukan.",
      });
    }

    return res.json({
      success: true,
      message: "Profil berhasil diperbarui.",
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email atau NIP sudah digunakan pengguna lain.",
      });
    }

    next(error);
  }
}

// =========================================================
// 3. CHANGE PASSWORD
// PATCH /api/auth/change-password
// =========================================================

async function changePassword(req, res, next) {
  try {
    const { password_lama, password_baru } = req.body;

    if (
      typeof password_lama !== "string" ||
      typeof password_baru !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Password lama dan password baru wajib diisi.",
      });
    }

    if (password_baru.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password baru minimal 8 karakter.",
      });
    }

    if (password_baru.length > 72) {
      return res.status(400).json({
        success: false,
        message: "Password baru maksimal 72 byte.",
      });
    }

    if (password_lama === password_baru) {
      return res.status(400).json({
        success: false,
        message: "Password baru harus berbeda dari password lama.",
      });
    }

    if (!isValidBcryptRounds()) {
      return res.status(500).json({
        success: false,
        message: "Konfigurasi BCRYPT_ROUNDS tidak valid.",
      });
    }

    const current = await query(
      `SELECT password_hash
       FROM pengguna
       WHERE id_pengguna = $1`,
      [req.user.id_pengguna],
    );

    if (!current.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Akun pengguna tidak ditemukan.",
      });
    }

    const valid = await bcrypt.compare(
      password_lama,
      current.rows[0].password_hash,
    );

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Password lama tidak sesuai.",
      });
    }

    const hash = await bcrypt.hash(password_baru, BCRYPT_ROUNDS);

    await query(
      `UPDATE pengguna
       SET
         password_hash = $1,
         wajib_ubah_password = FALSE,
         updated_at = NOW()
       WHERE id_pengguna = $2`,
      [hash, req.user.id_pengguna],
    );

    return res.json({
      success: true,
      message: "Password berhasil diperbarui.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
};
