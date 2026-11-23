require("dotenv").config();

const app = require("./app");
const { pool } = require("./src/config/database");

const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET wajib diisi dengan minimal 32 karakter.");
  }

  await pool.query("SELECT 1");
  console.log("PostgreSQL connected.");

  app.listen(PORT, () => {
    console.log(`Monitoring PSN API berjalan pada http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Gagal menjalankan server:", error.message);
  process.exit(1);
});

process.on("SIGINT", async () => {
  await pool.end();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});
