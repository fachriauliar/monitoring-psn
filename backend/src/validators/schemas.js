const Joi = require("joi");

const userFields = {
  nama_lengkap: Joi.string().trim().min(2).max(150).required(),
  nip: Joi.string().trim().allow("", null).max(30),
  email: Joi.string().trim().email().max(150).required(),
  no_hp: Joi.string().trim().allow("", null).max(25),
  jabatan: Joi.string().trim().allow("", null).max(120),
  bagian: Joi.string().trim().allow("", null).max(120),
  pangkat_golongan: Joi.string().trim().allow("", null).max(50),
  role: Joi.string().valid("admin", "kasie").required(),
};

const createUserSchema = Joi.object({
  ...userFields,
  password: Joi.string().min(8).max(72).required(),
  konfirmasi_password: Joi.string().valid(Joi.ref("password")).required()
    .messages({ "any.only": "Konfirmasi password tidak sesuai." }),
});

const updateUserSchema = Joi.object(userFields);

const profileSchema = Joi.object({
  nama_lengkap: Joi.string().trim().min(2).max(150).required(),
  nip: Joi.string().trim().allow("", null).max(30),
  email: Joi.string().trim().email().max(150).required(),
  no_hp: Joi.string().trim().allow("", null).max(25),
  jabatan: Joi.string().trim().allow("", null).max(120),
  bagian: Joi.string().trim().allow("", null).max(120),
  pangkat_golongan: Joi.string().trim().allow("", null).max(50),
});

const changePasswordSchema = Joi.object({
  password_lama: Joi.string().required(),

  password_baru: Joi.string()
    .min(8)
    .max(72)
    .required(),

  konfirmasi_password: Joi.string()
    .valid(Joi.ref("password_baru"))
    .required()
    .messages({
      "any.only": "Konfirmasi kata sandi tidak sesuai.",
    }),
});

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details.map((item) => item.message),
      });
    }

    req.body = value;
    next();
  };
}

module.exports = {
  createUserSchema,
  updateUserSchema,
  profileSchema,
  changePasswordSchema,
  validate,
};
