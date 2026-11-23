require("dotenv").config();

const bcrypt = require("bcrypt");
const { pool } = require("../src/config/database");

async function main() {
  const nama = process.env.INITIAL_USER_NAME;
  const email = process.env.INITIAL_USER_EMAIL;
  const password = process.env.INITIAL_USER_PASSWORD;
  const role = (process.env.INITIAL_USER_ROLE || "").toLowerCase();

  const nip = process.env.INITIAL_USER_NIP || "";
  const phone = process.env.INITIAL_USER_PHONE || "";
  const jabatan = process.env.INITIAL_USER_JABATAN || "";
  const bagian = process.env.INITIAL_USER_BAGIAN || "";
  const pangkat = process.env.INITIAL_USER_PANGKAT || "";

  const allowedRoles = ["admin", "superadmin"];

  if (!nama || !email || !password || password.length < 8) {
    throw new Error(
      "Nama, email, dan password wajib diisi. Password minimal 8 karakter.",
    );
  }

  if (!allowedRoles.includes(role)) {
    throw new Error(
      "Role harus admin atau superadmin. Isi INITIAL_USER_ROLE di .env.",
    );
  }

  const exists = await pool.query(
    `SELECT id_pengguna
     FROM pengguna
     WHERE LOWER(email) = LOWER($1)`,
    [email],
  );

  if (exists.rowCount > 0) {
    console.log("Akun dengan email tersebut sudah ada. Tidak ada perubahan.");
    return;
  }

  const rounds = Number(process.env.BCRYPT_ROUNDS || 12);

  if (!Number.isInteger(rounds) || rounds < 10 || rounds > 15) {
    throw new Error("BCRYPT_ROUNDS harus berupa angka antara 10 sampai 15.");
  }

  const hash = await bcrypt.hash(password, rounds);

  await pool.query(
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
      $1, NULLIF($2, ''), $3, NULLIF($4, ''),
      NULLIF($5, ''), NULLIF($6, ''), NULLIF($7, ''),
      $8, $9, TRUE
    )`,
    [nama, nip, email, phone, jabatan, bagian, pangkat, role, hash],
  );

  console.log(`Akun ${role} berhasil dibuat.`);
  console.log(`Email: ${email}`);
  console.log("Password awal harus diganti setelah login pertama.");
}

main()
  .catch((error) => {
    console.error("Gagal membuat akun:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
