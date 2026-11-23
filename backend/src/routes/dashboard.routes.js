const router = require("express").Router();

const controller = require("../controllers/dashboard.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const requirePasswordChanged = require("../middlewares/requirePasswordChanged");

// Dashboard publik tidak memerlukan login.
router.get("/public", controller.getPublicDashboard);

// Dashboard Admin dan Superadmin.
router.get(
  "/admin",
  authenticate,
  requirePasswordChanged,
  authorize("admin", "superadmin"),
  controller.getAdminDashboard,
);

module.exports = router;
