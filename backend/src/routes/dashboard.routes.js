const router = require("express").Router();
const controller = require("../controllers/dashboard.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

router.get("/public", controller.getPublicDashboard);
router.get("/admin", authenticate, authorize("admin"), controller.getAdminDashboard);
router.get("/kasie", authenticate, authorize("kasie"), controller.getKasieDashboard);

module.exports = router;
