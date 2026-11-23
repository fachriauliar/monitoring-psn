require("dotenv").config();

const bcrypt = require("bcrypt");
const { pool } = require("../src/config/database");

async function main() {
  const nama = process.env.INITIAL_KASIE_NAME;
  const email = process.env.INITIAL_KASIE_EMAIL;
  const password = process.env.INITIAL_KASIE_PASSWORD;

  if (!nama || !email || !password || password.length < 8) {
    throw new Error("Isi INITIAL_KASIE_NAME, INITIAL_KASIE_EMAIL, dan INITIAL_KASIE_PASSWORD (minimal 8 karakter) di .env.");
  }

  const exists = await pool.query(
    "SELECT id_pengguna FROM pengguna WHERE LOWER(email)=LOWER($1)",
    [email]
  );

  if (exists.rowCount) {
    console.log("Akun dengan email tersebut sudah ada. Tidak ada perubahan.");
    return;
  }

  const hash = await bcrypt.hash(password, Number(process.env.BCRYPT_ROUNDS || 12));
  await pool.query(
    `INSERT INTO pengguna
     (nama_lengkap, nip, email, no_hp, role, password_hash, wajib_ubah_password)
     VALUES ($1, NULLIF($2,''), $3, NULLIF($4,''), 'kasie', $5, TRUE)`,
    [nama, process.env.INITIAL_KASIE_NIP || "", email,
     process.env.INITIAL_KASIE_PHONE || "", hash]
  );

  console.log(`Akun Kasie berhasil dibuat untuk ${email}. Gunakan password awal dari .env dan segera ubah setelah login.`);
}

main()
  .catch((error) => {
    console.error("Gagal membuat akun Kasie:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
