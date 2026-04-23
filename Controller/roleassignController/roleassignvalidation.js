const Joi = require("joi");

const roleAssignSchema = Joi.object({
  userid: Joi.number().integer().positive().required(),
  // rid yahan pehle se hi sahi hai, jaisa ki userController.js mein expect kiya ja raha hai
  rid: Joi.array().items(Joi.number().integer().positive().required()).required(),
});

// Middleware for validation
const validateRoleAssign = (req, res, next) => {
  const { error } = roleAssignSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      error: "Invalid request",
      details: error.details.map((err) => err.message),
    });
  }

  next();
};

module.exports = validateRoleAssign;