const bcrypt = require("bcrypt");
const { query, pool } = require("../config/database");

const DEFAULT_PASSWORD = "Psn@2026Awal";

function publicColumns() {
  return `id_pengguna, nama_lengkap, nip, email, no_hp, jabatan, bagian,
          pangkat_golongan, role, status_akun, wajib_ubah_password,
          created_at, updated_at`;
}

async function listUsers(req, res, next) {
  try {
    const {
      search = "",
      role = "",
      status = "",
      page = "1",
      limit = "20",
    } = req.query;
    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (pageNumber - 1) * pageSize;

    const conditions = [];
    const values = [];
    if (search.trim()) {
      values.push(`%${search.trim()}%`);
      conditions.push(
        `(nama_lengkap ILIKE $${values.length} OR email ILIKE $${values.length} OR COALESCE(no_hp,'') ILIKE $${values.length} OR COALESCE(nip,'') ILIKE $${values.length})`,
      );
    }
    if (["admin", "kasie"].includes(role)) {
      values.push(role);
      conditions.push(`role=$${values.length}`);
    }
    if (["aktif", "nonaktif", "diblokir"].includes(status)) {
      values.push(status);
      conditions.push(`status_akun=$${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM pengguna ${where}`,
      values,
    );
    const dataValues = [...values, pageSize, offset];

    const result = await query(
      `SELECT ${publicColumns()} FROM pengguna ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      dataValues,
    );

    return res.json({
      success: true,
      message: "Data pengguna berhasil diambil.",
      data: result.rows,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: countResult.rows[0].total,
        total_pages: Math.ceil(countResult.rows[0].total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
}

// Mengambil statistik pengguna
async function getUserStatistics(req, res, next) {
  try {
    const result = await query(
      `SELECT
        COUNT(*)::int AS total_pengguna,
        COUNT(*) FILTER (WHERE role = 'admin')::int AS total_admin,
        COUNT(*) FILTER (WHERE role = 'kasie')::int AS total_kasie,
        COUNT(*) FILTER (WHERE status_akun = 'aktif')::int AS total_aktif
       FROM pengguna`,
    );

    return res.json({
      success: true,
      message: "Statistik pengguna berhasil diambil.",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function getUser(req, res, next) {
  try {
    const result = await query(
      `SELECT ${publicColumns()} FROM pengguna WHERE id_pengguna=$1`,
      [req.params.id],
    );
    if (!result.rowCount) {
      return res
        .status(404)
        .json({ success: false, message: "Pengguna tidak ditemukan." });
    }
    return res.json({
      success: true,
      message: "Detail pengguna berhasil diambil.",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const {
      nama_lengkap,
      nip,
      email,
      no_hp,
      jabatan,
      bagian,
      pangkat_golongan,
      role,
      password,
    } = req.body;

    const hash = await bcrypt.hash(
      DEFAULT_PASSWORD,
      Number(process.env.BCRYPT_ROUNDS || 12),
    );

    const result = await query(
      `INSERT INTO pengguna
       (nama_lengkap, nip, email, no_hp, jabatan, bagian,
        pangkat_golongan, role, password_hash, wajib_ubah_password)
       VALUES ($1, NULLIF($2,''), $3, NULLIF($4,''), NULLIF($5,''),
               NULLIF($6,''), NULLIF($7,''), $8, $9, TRUE)
       RETURNING ${publicColumns()}`,
      [
        nama_lengkap,
        nip || "",
        email,
        no_hp || "",
        jabatan || "",
        bagian || "",
        pangkat_golongan || "",
        role,
        hash,
      ],
    );

    return res.status(201).json({
      success: true,
      message:
        "Pengguna berhasil ditambahkan. Pengguna wajib mengubah password saat login pertama.",
      data: result.rows[0],
    });
  } catch (error) {
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "Email atau NIP sudah digunakan." });
    }
    next(error);
  }
}

async function updateUser(req, res, next) {
  const client = await pool.connect();
  try {
    const {
      nama_lengkap,
      nip,
      email,
      no_hp,
      jabatan,
      bagian,
      pangkat_golongan,
      role,
    } = req.body;

    await client.query("BEGIN");

    const current = await client.query(
      "SELECT id_pengguna, role FROM pengguna WHERE id_pengguna=$1 FOR UPDATE",
      [req.params.id],
    );

    if (!current.rowCount) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Pengguna tidak ditemukan." });
    }

    if (current.rows[0].role === "kasie" && role !== "kasie") {
      const count = await client.query(
        "SELECT COUNT(*)::int AS total FROM pengguna WHERE role='kasie' AND status_akun='aktif'",
      );
      if (count.rows[0].total <= 1) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Tidak dapat mengubah role Kasie aktif terakhir.",
        });
      }
    }

    const updated = await client.query(
      `UPDATE pengguna
       SET nama_lengkap=$1, nip=NULLIF($2,''), email=$3, no_hp=NULLIF($4,''),
           jabatan=NULLIF($5,''), bagian=NULLIF($6,''),
           pangkat_golongan=NULLIF($7,''), role=$8, updated_at=NOW()
       WHERE id_pengguna=$9
       RETURNING ${publicColumns()}`,
      [
        nama_lengkap,
        nip || "",
        email,
        no_hp || "",
        jabatan || "",
        bagian || "",
        pangkat_golongan || "",
        role,
        req.params.id,
      ],
    );

    await client.query("COMMIT");
    return res.json({
      success: true,
      message: "Data pengguna berhasil diperbarui.",
      data: updated.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ success: false, message: "Email atau NIP sudah digunakan." });
    }
    next(error);
  } finally {
    client.release();
  }
}

async function updateUserStatus(req, res, next) {
  try {
    const { status_akun } = req.body;
    if (!["aktif", "nonaktif", "diblokir"].includes(status_akun)) {
      return res
        .status(400)
        .json({ success: false, message: "Status akun tidak valid." });
    }

    if (
      Number(req.params.id) === Number(req.user.id_pengguna) &&
      status_akun !== "aktif"
    ) {
      return res.status(400).json({
        success: false,
        message: "Anda tidak dapat menonaktifkan akun sendiri.",
      });
    }

    const result = await query(
      `UPDATE pengguna SET status_akun=$1, updated_at=NOW()
       WHERE id_pengguna=$2 RETURNING ${publicColumns()}`,
      [status_akun, req.params.id],
    );

    if (!result.rowCount) {
      return res
        .status(404)
        .json({ success: false, message: "Pengguna tidak ditemukan." });
    }
    return res.json({
      success: true,
      message: "Status akun berhasil diperbarui.",
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
}

async function resetUserPassword(req, res, next) {
  try {
    const userId = Number(req.params.id);
    const currentUserId = Number(req.user.id_pengguna);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "ID pengguna tidak valid.",
      });
    }

    // Mencegah Kasie mereset password akunnya sendiri
    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "Anda tidak dapat mereset password akun sendiri melalui fitur ini.",
      });
    }

    // Pastikan pengguna tersedia
    const existingUser = await query(
      `SELECT id_pengguna, nama_lengkap
       FROM pengguna
       WHERE id_pengguna = $1`,
      [userId],
    );

    if (!existingUser.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    // Hash password default
    const hash = await bcrypt.hash(
      DEFAULT_PASSWORD,
      Number(process.env.BCRYPT_ROUNDS || 12),
    );

    // Perbarui password dan wajibkan perubahan password
    await query(
      `UPDATE pengguna
       SET password_hash = $1,
           wajib_ubah_password = TRUE,
           updated_at = NOW()
       WHERE id_pengguna = $2`,
      [hash, userId],
    );

    return res.json({
      success: true,
      message: `Password ${existingUser.rows[0].nama_lengkap} berhasil direset ke password default. Pengguna wajib mengganti password saat login berikutnya.`,
    });
  } catch (error) {
    next(error);
  }
}

async function deleteUser(req, res, next) {
  const client = await pool.connect();
  try {
    if (Number(req.params.id) === Number(req.user.id_pengguna)) {
      return res.status(400).json({
        success: false,
        message: "Anda tidak dapat menghapus akun sendiri.",
      });
    }

    await client.query("BEGIN");
    const target = await client.query(
      "SELECT id_pengguna, role, status_akun FROM pengguna WHERE id_pengguna=$1 FOR UPDATE",
      [req.params.id],
    );

    if (!target.rowCount) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Pengguna tidak ditemukan." });
    }

    if (
      target.rows[0].role === "kasie" &&
      target.rows[0].status_akun === "aktif"
    ) {
      const count = await client.query(
        "SELECT COUNT(*)::int AS total FROM pengguna WHERE role='kasie' AND status_akun='aktif'",
      );
      if (count.rows[0].total <= 1) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "Tidak dapat menghapus Kasie aktif terakhir.",
        });
      }
    }

    await client.query("DELETE FROM pengguna WHERE id_pengguna=$1", [
      req.params.id,
    ]);
    await client.query("COMMIT");
    return res.json({
      success: true,
      message: "Pengguna berhasil dihapus.",
      data: null,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

module.exports = {
  listUsers,
  getUserStatistics,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
  deleteUser,
};