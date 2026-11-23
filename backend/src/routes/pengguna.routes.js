const router = require("express").Router();

const controller = require("../controllers/pengguna.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");
const requirePasswordChanged = require("../middlewares/requirePasswordChanged");

const {
  createUserSchema,
  updateUserSchema,
  validate,
} = require("../validators/schemas");

router.use(authenticate, requirePasswordChanged, authorize("superadmin"));

router.get("/statistics", controller.getUserStatistics);
router.get("/", controller.listUsers);
router.get("/:id", controller.getUser);

router.post("/", validate(createUserSchema), controller.createUser);

router.put("/:id", validate(updateUserSchema), controller.updateUser);

router.patch("/:id/status", controller.updateUserStatus);

router.patch("/:id/reset-password", controller.resetUserPassword);

router.delete("/:id", controller.deleteUser);

module.exports = router;
