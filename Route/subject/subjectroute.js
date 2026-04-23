const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { getAllSubjects, addSubjects, deleteSubjects } = require("../../Controller/subject/subjectController");

// ===== Multer config =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) cb(null, true);
  else cb(new Error("Only image files are allowed"));
};

const upload = multer({ storage, fileFilter });

// ===== Routes =====
router.get("/viewsubjects", getAllSubjects);
router.post("/addsubjects", upload.single("image"), addSubjects);

router.delete("/:subject_id", deleteSubjects);

module.exports = router;
