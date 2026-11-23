
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const authRoutes = require("./src/routes/auth.routes");
const dashboardRoutes = require("./src/routes/dashboard.routes");
const profileRoutes = require("./src/routes/profile.routes");
const penggunaRoutes = require("./src/routes/pengguna.routes");

const laporanPsnRoutes = require("./src/routes/laporanPsn.routes");
const googleRoutes = require("./src/routes/google.routes");

const { notFound, errorHandler } = require("./src/middlewares/errorHandler");

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: (process.env.CLIENT_URL || "http://localhost:5173")
      .split(",")
      .map((item) => item.trim()),
    credentials: false,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Monitoring PSN API aktif.",
  });
});

// Authentication
app.use("/api/auth", authRoutes);

// Dashboard
app.use("/api/dashboard", dashboardRoutes);

// Profile
app.use("/api/profile", profileRoutes);

// Manajemen Pengguna
app.use("/api/pengguna", penggunaRoutes);

app.use("/api/laporan-psn", laporanPsnRoutes);
app.use("/api/google", googleRoutes);

// Error Handler
app.use(notFound);
app.use(errorHandler);

module.exports = app;
