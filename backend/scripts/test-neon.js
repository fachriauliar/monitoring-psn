require("dotenv").config();

const { pool } = require("../src/config/database");

async function testConnection() {
  try {
    const result = await pool.query("SELECT version(), NOW()");

    console.log("Koneksi Neon berhasil!");
    console.log("PostgreSQL:", result.rows[0].version);
    console.log("Waktu database:", result.rows[0].now);
  } catch (error) {
    console.error("Koneksi database gagal:", error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
