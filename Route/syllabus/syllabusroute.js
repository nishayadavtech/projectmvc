const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Import controller functions
const {
  getAllSyllabus,
  addSyllabus,
  updateSyllabus,
  patchSyllabus,
  deleteTutorial,
  deleteSyllabus,
  getMySyllabus,
  syllabusloginteacher,
  searchSyllabus,
  getSyllabusByCourse,
} = require("../../Controller/syllabus/syllabusController");

const autenticateTeacher = require("../../Middleware/autenticateTeacher");

// ===============================
// Multer File Upload Setup

const uploadDir = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log("'uploads' folder created successfully.");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName =
      "tutorial_" + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|mp4|mov|avi|mkv/;
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF or video files are allowed"));
    }
  },
});
const tutorialUpload = upload.any();

// ===============================
// ✅ SYLLABUS ROUTES

router.get("/getAll", getAllSyllabus);

// search by course or topic
router.get("/search", searchSyllabus);

router.post("/addSyllabus", tutorialUpload, addSyllabus);

router.put("/update/:id", tutorialUpload, updateSyllabus);

router.patch("/patchSyllabus/:id", tutorialUpload, patchSyllabus);
router.delete("/deleteTutorial/:id", deleteTutorial);

router.delete("/delete/:id", deleteSyllabus);

// teacher specific
router.get("/my-syllabus", autenticateTeacher, getMySyllabus);
router.get(
  "/by-course",getSyllabusByCourse
);
router.get("/syllabusloginteacher", autenticateTeacher, syllabusloginteacher);

module.exports = router;
