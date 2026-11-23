const express = require("express");

const router = express.Router();

const authenticate = require("../middlewares/authenticate");

const {
  getLaporanPsn,
  syncLaporanPsn,
} = require("../controllers/laporanPsn.controller");

// Semua endpoint membutuhkan login.
router.use(authenticate);

// Hanya Admin Kelurahan dan Kasie Kesra.
router.use((req, res, next) => {
  if (!["admin", "kasie"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Anda tidak memiliki akses ke data pemeriksaan PSN.",
    });
  }

  next();
});

// Mengambil data dari PostgreSQL.
router.get("/", getLaporanPsn);

// Sinkronisasi Google Sheets ke PostgreSQL.
router.post("/sync", syncLaporanPsn);

module.exports = router;
