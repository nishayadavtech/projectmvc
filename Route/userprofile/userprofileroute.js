const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {getUserProfile,getbyUserid,postUserProfile,
} = require("../../Controller/userprofile/userprofileController");

//Storage kaha kon si file save hogi
const storage = multer.diskStorage({
  destination: "Uploads/",
  filename: (req, file, cb) => {
    const userid = req.body.userid || "user";
    const username = req.body.username || "guest";
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.fieldname === "profile_photo") {
      return cb(null, `${userid}_${username}_profile_photo${ext}`);
    }
    if (file.fieldname === "qualification_photo") {
      return cb(null, `${userid}_${username}_qualification_photo${ext}`);
    }
    if (file.fieldname === "aadhar_profile_photo") {
      return cb(null, `${userid}_${username}_aadhar_profile_photo${ext}`);
    }

    cb(null, Date.now() + "_" + file.originalname);
  },
});

// File filter hoke aayegi png jpg 
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === "profile_photo") {
    const allowed = [".jpg", ".jpeg", ".png"];
    if (!allowed.includes(ext)) {
      return cb(
        new Error("Only JPG or PNG allowed for profile photo"),
        false
      );
    }
  }

  if (file.fieldname === "aadhar_profile_photo") {
    const allowed = [".jpg", ".jpeg", ".png"];
    if (!allowed.includes(ext)) {
      return cb(
        new Error("Only JPG or PNG allowed for aadhar photo"),
        false
      );
    }
  }

  if (file.fieldname === "qualification_photo") {
      const allowed = [".jpg", ".jpeg", ".png"];
   
    if (!allowed.includes(ext)) {
      return cb(
        new Error("Only PDF or DOCX allowed for qualification"),
        false
      );
    }
  }

  cb(null, true);
};

// Multer image upload
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, 
}).fields([
  { name: "profile_photo", maxCount: 1 },
  { name: "aadhar_profile_photo", maxCount: 1 },
  { name: "qualification_photo", maxCount: 1 },
]);

// ===== Size check k liye =====
function checkSizes(req, res, next) {
  if (req.files?.profile_photo?.[0]?.size > 500 * 1024) {
    return res
      .status(400)
      .send("Profile photo must be under 500KB");
  }
  if (req.files?.aadhar_profile_photo?.[0]?.size > 500 * 1024) {
    return res
      .status(400)
      .send("Aadhar photo must be under 500KB");
  }
  if (req.files?.qualification_photo?.[0]?.size > 2 * 1024 * 1024) {
    return res
      .status(400)
      .send("Qualification document must be under 2MB");
  }
  next();
}

// ===== Routes =====
router.get("/viewprofile", getUserProfile);
router.get("/viewprofile/:userid", getbyUserid);
router.post("/addprofile", upload, checkSizes, postUserProfile);

module.exports = router;

