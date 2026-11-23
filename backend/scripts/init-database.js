require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { pool } = require("../src/config/database");

async function main() {
  const schemaPath = path.join(__dirname, "..", "database", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf8");
  await pool.query(sql);
  console.log("Struktur database berhasil dibuat/diperiksa.");
}

main()
  .catch((error) => {
    console.error("Gagal inisialisasi database:", error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
