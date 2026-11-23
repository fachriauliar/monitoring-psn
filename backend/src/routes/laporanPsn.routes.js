const router = require("express").Router();

const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const requirePasswordChanged = require("../middlewares/requirePasswordChanged");

const {
  getLaporanPsn,
  syncLaporanPsn,
} = require("../controllers/laporanPsn.controller");

// Semua endpoint membutuhkan login dan perubahan password awal.
router.use(authenticate, requirePasswordChanged);

// Hanya Admin dan Superadmin.
router.use(authorize("admin", "superadmin"));

// Mengambil data pemeriksaan PSN.
router.get("/", getLaporanPsn);

// Sinkronisasi Google Sheets ke PostgreSQL.
router.post("/sync", syncLaporanPsn);

module.exports = router;
