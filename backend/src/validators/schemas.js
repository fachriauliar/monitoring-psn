const Joi = require("joi");

// =========================================================
// FIELD PENGGUNA
// =========================================================

const userFields = {
  nama_lengkap: Joi.string().trim().min(2).max(150).required(),

  nip: Joi.string().trim().allow("", null).max(30),

  email: Joi.string().trim().email().max(150).required(),

  no_hp: Joi.string().trim().allow("", null).max(25),

  jabatan: Joi.string().trim().allow("", null).max(120),

  bagian: Joi.string().trim().allow("", null).max(120),

  pangkat_golongan: Joi.string().trim().allow("", null).max(50),

  role: Joi.string().valid("admin", "superadmin").required(),
};

// =========================================================
// CREATE USER
// POST /api/pengguna
// Password sementara dibuat otomatis oleh backend.
// =========================================================

const createUserSchema = Joi.object({
  ...userFields,
});

// =========================================================
// UPDATE USER
// PUT /api/pengguna/:id
// =========================================================

const updateUserSchema = Joi.object({
  ...userFields,
});

// =========================================================
// UPDATE PROFILE
// PUT /api/profile
// =========================================================

const profileSchema = Joi.object({
  nama_lengkap: Joi.string().trim().min(2).max(150).required(),

  nip: Joi.string().trim().allow("", null).max(30),

  email: Joi.string().trim().email().max(150).required(),

  no_hp: Joi.string().trim().allow("", null).max(25),

  jabatan: Joi.string().trim().allow("", null).max(120),

  bagian: Joi.string().trim().allow("", null).max(120),

  pangkat_golongan: Joi.string().trim().allow("", null).max(50),
});

// =========================================================
// CHANGE PASSWORD
// PATCH /api/auth/change-password
// =========================================================

const changePasswordSchema = Joi.object({
  password_lama: Joi.string().required().messages({
    "string.empty": "Password lama wajib diisi.",
    "any.required": "Password lama wajib diisi.",
  }),

  password_baru: Joi.string().min(8).max(72).required().messages({
    "string.min": "Password baru minimal 8 karakter.",
    "string.max": "Password baru maksimal 72 karakter.",
    "any.required": "Password baru wajib diisi.",
  }),

  konfirmasi_password: Joi.string()
    .valid(Joi.ref("password_baru"))
    .required()
    .messages({
      "any.only": "Konfirmasi password tidak sesuai.",
      "any.required": "Konfirmasi password wajib diisi.",
    }),
});

// =========================================================
// VALIDATION MIDDLEWARE
// =========================================================

function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
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
