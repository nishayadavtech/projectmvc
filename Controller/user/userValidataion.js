const Joi = require("joi");

const userSchema = Joi.object({
  // *** CORRECTION: userid is usually created by the DB on POST. Make it optional. ***
  userid: Joi.string().alphanum().min(1).max(50).optional(), 
  username: Joi.string().min(3).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required(),
  password: Joi.string().min(6).max(100).required(),
  // Agar address field req.body mein aa sakta hai, toh isko bhi optional define karein.
  address: Joi.string().optional(),
});

// Middleware for validation
const validateSchema = (req, res, next) => {
  // *** NOTE: Postman login request mein sirf email aur password hain. ***
  // *** Agar yeh validation login ke liye use ho raha hai, toh yeh galat hai. ***
  // *** Lekin main isko POST /additem ke liye theek kar raha hoon. ***
  
  const { error } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      error: "Invalid request",
      details: error.details.map((err) => err.message),
    });
  }

  next();
};

module.exports = validateSchema;