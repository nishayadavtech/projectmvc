// const express = require("express");
// const router = express.Router();

// const {
//   signupTeacher,
//   LoginTeacher,
//   getAllTeachers,
//   getTeacherById,
//   updateTeacher,
//   deleteTeacher,
//   teacherProfile
// } = require("../../Controller/teacher/teacherController");

// const autenticateTeacher = require("../../Middleware/autenticateTeacher");

// /* ================= AUTH ================= */
// router.post("/signup", signupTeacher);
// router.post("/login", LoginTeacher);

// /* ================= PROFILE ================= */
// router.get("/profile", autenticateTeacher, teacherProfile);

// /* ================= CRUD ================= */
// router.get("/", autenticateTeacher, getAllTeachers);
// router.get("/:id", autenticateTeacher, getTeacherById);
// router.put("/:id", autenticateTeacher, updateTeacher);
// router.delete("/:id", autenticateTeacher, deleteTeacher);


// module.exports = router;




const express = require("express");
const router = express.Router();
const path = require("path");
const multer = require("multer");

const {
  signupTeacher,
  LoginTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  teacherProfile,
  getMyCourses,
  updatemyCourse,
  deletemyCourse,
} = require("../../Controller/teacher/teacherController");

const autenticateTeacher = require("../../Middleware/autenticateTeacher");
const authorizeRoles = autenticateTeacher.authorizeRoles;

/* ================= MULTER CONFIG ================= */

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

/* ================= AUTH ================= */
router.post("/signup", signupTeacher);
router.post("/login", LoginTeacher);

/* ================= PROFILE ================= */
router.get(
  "/profile",
  autenticateTeacher,
  authorizeRoles("teacher", "admin"),
  teacherProfile
);

/* ================= MY COURSES (SECURE) ================= */
router.get(
  "/my-courses",
  autenticateTeacher,
  authorizeRoles("teacher", "admin"),
  getMyCourses
);

/* ================= TEACHER CRUD ================= */
router.get("/", autenticateTeacher, authorizeRoles("admin"), getAllTeachers);
router.put("/:id", autenticateTeacher, authorizeRoles("admin"), updateTeacher);
router.delete(
  "/:id",
  autenticateTeacher,
  authorizeRoles("admin"),
  deleteTeacher
);

router.put(
  "/updatecourse/:id",
  autenticateTeacher,
  authorizeRoles("teacher", "admin"),
  upload.single("image"),
  updatemyCourse
);

//  Delete My Course
router.delete(
  "/deletecourse/:id",
  autenticateTeacher,
  authorizeRoles("teacher", "admin"),
  deletemyCourse
);

router.get(
  "/:id",
  autenticateTeacher,
  authorizeRoles("teacher", "admin"),
  getTeacherById
);

module.exports = router;
