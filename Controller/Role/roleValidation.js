const Joi = require ("joi");

// *** CORRECTION: Schema ko single object ke liye badla gaya ***
const rolesSchema = Joi.object({
  // 'roleid' ko hata diya gaya hai, kyunki woh DB mein auto-incremented ho sakta hai.
  // Agar aapko roleid manually set karna hai, toh isse wapas add kar sakte hain.
  rname: Joi.string().min(2).max(100).required(),
});


const validateSchema = (req,res,next) => {
    // *** NOTE: abortEarly: false add kiya for better error messages ***
    const {error} = rolesSchema.validate(req.body, { abortEarly: false });
    
    if(error){
        // *** CORRECTION: Proper 400 status aur details bheje ***
        return res.status(400).json({
            error: "Invalid request data for role",
            details: error.details.map(err => err.message)
        });
    }

    next();
}

module.exports = validateSchema;