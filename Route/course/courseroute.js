const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

/* ================= CONTROLLERS ================= */

const {
  searchCourse,
  getSingleCourse,
  getAllCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCoursesByTeacher,
  searchCourseByTeacherName,
  getMyCourses,
  getCourseDetail,
  updateCoursePrice,
  getAllCoursesPublic,
} = require("../../Controller/course/courseController");

const autenticateTeacher = require("../../Middleware/autenticateTeacher");
const authorizeRoles = autenticateTeacher.authorizeRoles;

/* ================= MULTER CONFIG (FIXED) ================= */

// Absolute uploads folder (VERY IMPORTANT)
const uploadPath = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, "image-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

/* ================= ROUTES ================= */

// 🔍 SEARCH
router.get("/search", searchCourse);
router.get("/search/teachername", searchCourseByTeacherName);

// 📚 GET COURSES
router.get("/getallcourses", getAllCourse);
router.get("/getcourse/:id", getSingleCourse);
router.get("/teacher/:teacher_id", getCoursesByTeacher);
router.get("/course-detail/:id", getCourseDetail);
router.get("/all-courses", getAllCoursesPublic);

// ➕ CREATE COURSE (Logged-in Teacher)
router.post(
  "/addcourse",
  autenticateTeacher,
  authorizeRoles("teacher", "admin"),
  upload.single("image"),
  createCourse
);

// ✏ UPDATE COURSE
router.put(
  "/updatecourse/:id",
  autenticateTeacher,
  authorizeRoles("teacher", "admin"),
  upload.single("image"),
  updateCourse
);

//  DELETE COURSE
router.delete(
  "/deletecourse/:id",
  autenticateTeacher,
  authorizeRoles("teacher", "admin"),
  deleteCourse
);

// UPDATE PRICE
router.put("/update-price/:id", updateCoursePrice);

//LOGGED-IN TEACHER COURSES
router.get(
  "/my-courses",
  autenticateTeacher,
  authorizeRoles("teacher", "admin"),
  getMyCourses
);

module.exports = router;
