const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { query, pool } = require("../config/database");

// =========================================================
// KONFIGURASI
// =========================================================

const ALLOWED_ROLES = ["admin", "superadmin"];
const ALLOWED_STATUSES = ["aktif", "nonaktif", "diblokir"];

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS || 12);

function publicColumns() {
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

function generateTemporaryPassword() {
  return "Psn@2026Awal";
}

function isValidUserId(id) {
  const value = Number(id);
  return Number.isInteger(value) && value > 0;
}

function isValidBcryptRounds() {
  return (
    Number.isInteger(BCRYPT_ROUNDS) &&
    BCRYPT_ROUNDS >= 10 &&
    BCRYPT_ROUNDS <= 15
  );
}

// Memastikan akun Superadmin aktif terakhir tidak
// kehilangan role, status aktif, atau dihapus.
async function protectLastSuperadmin(client, targetId, action) {
  const target = await client.query(
    `SELECT id_pengguna, role, status_akun
     FROM pengguna
     WHERE id_pengguna = $1
     FOR UPDATE`,
    [targetId],
  );

  if (!target.rowCount) {
    return {
      exists: false,
      blocked: false,
    };
  }

  const user = target.rows[0];

  const removesActiveSuperadmin =
    user.role === "superadmin" &&
    user.status_akun === "aktif" &&
    action === "remove";

  if (!removesActiveSuperadmin) {
    return {
      exists: true,
      blocked: false,
    };
  }

  const count = await client.query(
    `SELECT COUNT(*)::int AS total
     FROM pengguna
     WHERE role = 'superadmin'
       AND status_akun = 'aktif'`,
  );

  if (count.rows[0].total <= 1) {
    return {
      exists: true,
      blocked: true,
    };
  }

  return {
    exists: true,
    blocked: false,
  };
}

// =========================================================
// 1. DAFTAR PENGGUNA
// GET /api/pengguna
// =========================================================

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

    if (String(search).trim()) {
      values.push(`%${String(search).trim()}%`);

      conditions.push(`
        (
          nama_lengkap ILIKE $${values.length}
          OR email ILIKE $${values.length}
          OR COALESCE(no_hp, '') ILIKE $${values.length}
          OR COALESCE(nip, '') ILIKE $${values.length}
        )
      `);
    }

    if (ALLOWED_ROLES.includes(role)) {
      values.push(role);
      conditions.push(`role = $${values.length}`);
    }

    if (ALLOWED_STATUSES.includes(status)) {
      values.push(status);
      conditions.push(`status_akun = $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const countResult = await query(
      `SELECT COUNT(*)::int AS total
       FROM pengguna
       ${where}`,
      values,
    );

    const dataValues = [...values, pageSize, offset];

    const result = await query(
      `SELECT ${publicColumns()}
       FROM pengguna
       ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length + 1}
       OFFSET $${values.length + 2}`,
      dataValues,
    );

    const total = countResult.rows[0].total;

    return res.json({
      success: true,
      message: "Data pengguna berhasil diambil.",
      data: result.rows,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        total_pages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
}

// =========================================================
// 2. STATISTIK PENGGUNA
// GET /api/pengguna/statistics
// =========================================================

async function getUserStatistics(req, res, next) {
  try {
    const result = await query(
      `SELECT
        COUNT(*)::int AS total_pengguna,

        COUNT(*) FILTER (
          WHERE role = 'admin'
        )::int AS total_admin,

        COUNT(*) FILTER (
          WHERE role = 'superadmin'
        )::int AS total_superadmin,

        COUNT(*) FILTER (
          WHERE status_akun = 'aktif'
        )::int AS total_aktif,

        COUNT(*) FILTER (
          WHERE status_akun = 'nonaktif'
        )::int AS total_nonaktif,

        COUNT(*) FILTER (
          WHERE status_akun = 'diblokir'
        )::int AS total_diblokir

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

// =========================================================
// 3. DETAIL PENGGUNA
// GET /api/pengguna/:id
// =========================================================

async function getUser(req, res, next) {
  try {
    if (!isValidUserId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID pengguna tidak valid.",
      });
    }

    const result = await query(
      `SELECT ${publicColumns()}
       FROM pengguna
       WHERE id_pengguna = $1`,
      [req.params.id],
    );

    if (!result.rowCount) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
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

// =========================================================
// 4. TAMBAH PENGGUNA
// POST /api/pengguna
// =========================================================

async function createUser(req, res, next) {
  try {
    if (!isValidBcryptRounds()) {
      return res.status(500).json({
        success: false,
        message: "Konfigurasi BCRYPT_ROUNDS tidak valid.",
      });
    }

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

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role pengguna tidak valid.",
      });
    }

    const temporaryPassword = generateTemporaryPassword();

    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    const result = await query(
      `INSERT INTO pengguna (
        nama_lengkap,
        nip,
        email,
        no_hp,
        jabatan,
        bagian,
        pangkat_golongan,
        role,
        password_hash,
        wajib_ubah_password
      )
      VALUES (
        $1,
        NULLIF($2, ''),
        $3,
        NULLIF($4, ''),
        NULLIF($5, ''),
        NULLIF($6, ''),
        NULLIF($7, ''),
        $8,
        $9,
        TRUE
      )
      RETURNING ${publicColumns()}`,
      [
        nama_lengkap,
        nip || "",
        String(email).trim().toLowerCase(),
        no_hp || "",
        jabatan || "",
        bagian || "",
        pangkat_golongan || "",
        role,
        passwordHash,
      ],
    );

    return res.status(201).json({
      success: true,
      message:
        "Pengguna berhasil ditambahkan. Password sementara ditampilkan satu kali dan wajib diganti saat login pertama.",
      data: result.rows[0],
      temporary_password: temporaryPassword,
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email atau NIP sudah digunakan.",
      });
    }

    next(error);
  }
}

// =========================================================
// 5. PERBARUI PENGGUNA
// PUT /api/pengguna/:id
// =========================================================

async function updateUser(req, res, next) {
  if (!isValidUserId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "ID pengguna tidak valid.",
    });
  }

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

  if (!ALLOWED_ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Role pengguna tidak valid.",
    });
  }

  // Cegah pengguna mengubah role akunnya sendiri.
  if (
    Number(req.params.id) === Number(req.user.id_pengguna) &&
    role !== req.user.role
  ) {
    return res.status(400).json({
      success: false,
      message: "Anda tidak dapat mengubah role akun sendiri.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const current = await client.query(
      `SELECT id_pengguna, role, status_akun
       FROM pengguna
       WHERE id_pengguna = $1
       FOR UPDATE`,
      [req.params.id],
    );

    if (!current.rowCount) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    const currentUser = current.rows[0];

    // Lindungi Superadmin aktif terakhir.
    if (
      currentUser.role === "superadmin" &&
      currentUser.status_akun === "aktif" &&
      role !== "superadmin"
    ) {
      const count = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM pengguna
         WHERE role = 'superadmin'
           AND status_akun = 'aktif'`,
      );

      if (count.rows[0].total <= 1) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Tidak dapat mengubah role Superadmin aktif terakhir.",
        });
      }
    }

    const updated = await client.query(
      `UPDATE pengguna
       SET
         nama_lengkap = $1,
         nip = NULLIF($2, ''),
         email = $3,
         no_hp = NULLIF($4, ''),
         jabatan = NULLIF($5, ''),
         bagian = NULLIF($6, ''),
         pangkat_golongan = NULLIF($7, ''),
         role = $8,
         updated_at = NOW()
       WHERE id_pengguna = $9
       RETURNING ${publicColumns()}`,
      [
        nama_lengkap,
        nip || "",
        String(email).trim().toLowerCase(),
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
      return res.status(409).json({
        success: false,
        message: "Email atau NIP sudah digunakan.",
      });
    }

    next(error);
  } finally {
    client.release();
  }
}

// =========================================================
// 6. PERBARUI STATUS PENGGUNA
// PATCH /api/pengguna/:id/status
// =========================================================

async function updateUserStatus(req, res, next) {
  if (!isValidUserId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "ID pengguna tidak valid.",
    });
  }

  const { status_akun } = req.body;

  if (!ALLOWED_STATUSES.includes(status_akun)) {
    return res.status(400).json({
      success: false,
      message: "Status akun tidak valid.",
    });
  }

  // Cegah pengguna mengubah status akunnya sendiri.
  if (Number(req.params.id) === Number(req.user.id_pengguna)) {
    return res.status(400).json({
      success: false,
      message: "Anda tidak dapat mengubah status akun sendiri.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const current = await client.query(
      `SELECT id_pengguna, role, status_akun
       FROM pengguna
       WHERE id_pengguna = $1
       FOR UPDATE`,
      [req.params.id],
    );

    if (!current.rowCount) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    const user = current.rows[0];

    // Lindungi Superadmin aktif terakhir.
    if (
      user.role === "superadmin" &&
      user.status_akun === "aktif" &&
      status_akun !== "aktif"
    ) {
      const count = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM pengguna
         WHERE role = 'superadmin'
           AND status_akun = 'aktif'`,
      );

      if (count.rows[0].total <= 1) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Tidak dapat menonaktifkan Superadmin aktif terakhir.",
        });
      }
    }

    const result = await client.query(
      `UPDATE pengguna
       SET
         status_akun = $1,
         updated_at = NOW()
       WHERE id_pengguna = $2
       RETURNING ${publicColumns()}`,
      [status_akun, req.params.id],
    );

    await client.query("COMMIT");

    return res.json({
      success: true,
      message: "Status akun berhasil diperbarui.",
      data: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
}

// =========================================================
// 7. RESET PASSWORD PENGGUNA
// PATCH /api/pengguna/:id/reset-password
// =========================================================

async function resetUserPassword(req, res, next) {
  try {
    if (!isValidUserId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "ID pengguna tidak valid.",
      });
    }

    if (!isValidBcryptRounds()) {
      return res.status(500).json({
        success: false,
        message: "Konfigurasi BCRYPT_ROUNDS tidak valid.",
      });
    }

    const userId = Number(req.params.id);
    const currentUserId = Number(req.user.id_pengguna);

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message:
          "Anda tidak dapat mereset password akun sendiri melalui fitur ini.",
      });
    }

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

    const temporaryPassword = generateTemporaryPassword();

    const passwordHash = await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS);

    await query(
      `UPDATE pengguna
       SET password_hash = $1,
           wajib_ubah_password = TRUE,
           updated_at = NOW()
       WHERE id_pengguna = $2`,
      [passwordHash, userId],
    );

    return res.json({
      success: true,
      message:
        "Password berhasil direset. Pengguna wajib mengganti password saat login berikutnya.",
      data: {
        id_pengguna: userId,
        nama_lengkap: existingUser.rows[0].nama_lengkap,
      },
      temporary_password: temporaryPassword,
    });
  } catch (error) {
    next(error);
  }
}

// =========================================================
// 8. HAPUS PENGGUNA
// DELETE /api/pengguna/:id
// =========================================================

async function deleteUser(req, res, next) {
  if (!isValidUserId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "ID pengguna tidak valid.",
    });
  }

  // Cegah pengguna menghapus akunnya sendiri.
  if (Number(req.params.id) === Number(req.user.id_pengguna)) {
    return res.status(400).json({
      success: false,
      message: "Anda tidak dapat menghapus akun sendiri.",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const target = await client.query(
      `SELECT id_pengguna, role, status_akun
       FROM pengguna
       WHERE id_pengguna = $1
       FOR UPDATE`,
      [req.params.id],
    );

    if (!target.rowCount) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    const user = target.rows[0];

    // Lindungi Superadmin aktif terakhir.
    if (user.role === "superadmin" && user.status_akun === "aktif") {
      const count = await client.query(
        `SELECT COUNT(*)::int AS total
         FROM pengguna
         WHERE role = 'superadmin'
           AND status_akun = 'aktif'`,
      );

      if (count.rows[0].total <= 1) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          success: false,
          message: "Tidak dapat menghapus Superadmin aktif terakhir.",
        });
      }
    }

    await client.query(
      `DELETE FROM pengguna
       WHERE id_pengguna = $1`,
      [req.params.id],
    );

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

// =========================================================
// EXPORT
// =========================================================

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
