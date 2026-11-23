const bcrypt = require("bcrypt");
const { query } = require("../config/database");

async function getProfile(req, res, next) {
  try {
    const result = await query(
      `SELECT id_pengguna, nama_lengkap, nip, email, no_hp, jabatan,
              bagian, pangkat_golongan, role, status_akun,
              wajib_ubah_password, created_at, updated_at
       FROM pengguna WHERE id_pengguna = $1`,
      [req.user.id_pengguna]
    );

    return res.json({ success: true, message: "Profil berhasil diambil.", data: result.rows[0] });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const {
      nama_lengkap, nip, email, no_hp, jabatan, bagian, pangkat_golongan,
    } = req.body;

    const result = await query(
      `UPDATE pengguna
       SET nama_lengkap=$1, nip=NULLIF($2,''), email=$3, no_hp=NULLIF($4,''),
           jabatan=NULLIF($5,''), bagian=NULLIF($6,''),
           pangkat_golongan=NULLIF($7,''), updated_at=NOW()
       WHERE id_pengguna=$8
       RETURNING id_pengguna, nama_lengkap, nip, email, no_hp, jabatan,
                 bagian, pangkat_golongan, role, status_akun,
                 wajib_ubah_password, created_at, updated_at`,
      [nama_lengkap, nip || "", email, no_hp || "", jabatan || "",
       bagian || "", pangkat_golongan || "", req.user.id_pengguna]
    );

    return res.json({ success: true, message: "Profil berhasil diperbarui.", data: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({ success: false, message: "Email atau NIP sudah digunakan." });
    }
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { password_lama, password_baru } = req.body;
    const current = await query(
      "SELECT password_hash FROM pengguna WHERE id_pengguna=$1",
      [req.user.id_pengguna]
    );

    const valid = await bcrypt.compare(password_lama, current.rows[0].password_hash);
    if (!valid) {
      return res.status(400).json({ success: false, message: "Password lama tidak sesuai." });
    }

    if (password_lama === password_baru) {
      return res.status(400).json({ success: false, message: "Password baru harus berbeda dari password lama." });
    }

    const rounds = Number(process.env.BCRYPT_ROUNDS || 12);
    const hash = await bcrypt.hash(password_baru, rounds);

    await query(
      `UPDATE pengguna SET password_hash=$1, wajib_ubah_password=FALSE,
       updated_at=NOW() WHERE id_pengguna=$2`,
      [hash, req.user.id_pengguna]
    );

    return res.json({ success: true, message: "Password berhasil diperbarui.", data: null });
  } catch (error) {
    next(error);
  }
}

module.exports = { getProfile, updateProfile, changePassword };
