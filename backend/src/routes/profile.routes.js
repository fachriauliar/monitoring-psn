const router = require("express").Router();
const controller = require("../controllers/profile.controller");
const authenticate = require("../middlewares/authenticate");
const { profileSchema, validate } = require("../validators/schemas");

router.use(authenticate);
router.get("/", controller.getProfile);
router.put("/", validate(profileSchema), controller.updateProfile);

module.exports = router;
