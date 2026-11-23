const router = require("express").Router();

const controller = require("../controllers/pengguna.controller");
const authenticate = require("../middlewares/authenticate");
const authorize = require("../middlewares/authorize");

const {
  createUserSchema,
  updateUserSchema,
  validate,
} = require("../validators/schemas");

// Semua endpoint hanya dapat diakses Kasie
router.use(authenticate, authorize("kasie"));

// Daftar pengguna
router.get("/", controller.listUsers);

// Statistik pengguna
// Harus diletakkan sebelum /:id
router.get("/statistics", controller.getUserStatistics);

// Detail pengguna
router.get("/:id", controller.getUser);

// Tambah pengguna
router.post("/", validate(createUserSchema), controller.createUser);

// Edit pengguna
router.put("/:id", validate(updateUserSchema), controller.updateUser);

// Ubah status pengguna
router.patch("/:id/status", controller.updateUserStatus);

// Reset password pengguna
router.patch("/:id/reset-password", controller.resetUserPassword);

// Hapus pengguna
router.delete("/:id", controller.deleteUser);

module.exports = router;