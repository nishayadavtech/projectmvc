const express = require("express");
const router = express.Router();

const {
  signupStudent,
  loginStudent,
  getAllStudents,
  getStudentById,
  deleteStudent,
  getStudentDashboard,
} = require("../../Controller/studentController/studentController");

/* AUTH */
router.post("/signup", signupStudent);
router.post("/login", loginStudent);

/* CRUD */
router.get("/all", getAllStudents);
router.get("/dashboard/:id", getStudentDashboard);
router.get("/:id", getStudentById);
router.delete("/:id", deleteStudent);

module.exports = router;
