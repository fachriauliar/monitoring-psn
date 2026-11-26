const router = require("express").Router();
const rateLimit = require("express-rate-limit");

const auth = require("../controllers/auth.controller");
const authenticate = require("../middlewares/authenticate");

const { changePasswordSchema, validate } = require("../validators/schemas");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Terlalu banyak percobaan login. Coba lagi beberapa saat.",
  },
});

// Login
router.post("/login", loginLimiter, auth.login);

// Informasi sesi pengguna
router.get("/me", authenticate, auth.me);

// Ubah password
router.patch(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  auth.changePassword,
);

module.exports = router;
