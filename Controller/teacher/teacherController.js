require("dotenv").config();
const connection = require("../../Model/dbConnect");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function buildTeacherTokenPayload(teacher, roles = ["teacher"]) {
  return {
    id: teacher.id,
    userId: teacher.id,
    teacherId: teacher.id,
    email: teacher.email,
    roles,
    role: roles,
  };
}

// ================== SIGNUP TEACHER ==================
const signupTeacher = async (req, res) => {
  try {
    const {
      id,
      name,
      email,
      password,
      phone,
      qualification,
      specialization,
      bio,
    } = req.body;

    const image = req.file ? req.file.filename : null;

    if (!id || !name || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const checkQuery = "SELECT * FROM teacher WHERE email = ?";
    connection.query(checkQuery, [email], async (err, results) => {
      if (err) return res.status(500).json({ message: err.sqlMessage });

      if (results.length > 0) {
        return res.status(409).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `
        INSERT INTO teacher 
        (id, name, email, password, phone, qualification, specialization, bio, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      connection.query(
        sql,
        [
          id,
          name,
          email,
          hashedPassword,
          phone,
          qualification,
          specialization,
          bio,
          image,
        ],
        (insertErr) => {
          if (insertErr)
            return res.status(500).json({ message: insertErr.sqlMessage });

          const token = jwt.sign(buildTeacherTokenPayload({ id, email }), JWT_SECRET, {
            expiresIn: "1d",
          });

          res.status(201).json({
            message: "Teacher registered successfully",
            token,
            teacher: { id, name, email, phone },
          });
        },
      );
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// const LoginTeacher = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({ message: "Email and password required" });
//     }

//     const sql = "SELECT * FROM teacher WHERE email = ?";

//     connection.query(sql, [email], async (err, result) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).json({ message: "Database error" });
//       }

//       if (result.length === 0) {
//         return res.status(404).json({ message: "Teacher not found" });
//       }

//       const teacher = result[0];

//       const isMatch = await bcrypt.compare(password, teacher.password);
//       if (!isMatch) {
//         return res.status(401).json({ message: "Invalid password" });
//       }

//       // ✅ IMPORTANT CHANGE HERE
//       const token = jwt.sign(
//   { id: teacher.id },   // 🔥 correct
//   process.env.JWT_SECRET,
//   { expiresIn: "1d" }
// );

//       res.json({
//         message: "Login successful",
//         token,
//         teacher: {
//           teacher_id: teacher.teacher_id,
//           name: teacher.name,
//           email: teacher.email
//         }
//       });
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
const LoginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const sql = "SELECT * FROM teacher WHERE email = ?";

    connection.query(sql, [email], async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      const teacher = result[0];

      const isMatch = await bcrypt.compare(password, teacher.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid password" });
      }

      const token = jwt.sign(
        buildTeacherTokenPayload(teacher),
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      res.json({
        message: "Login successful",
        token,
        teacher: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          roles: ["teacher"],
        },
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ================= GET ALL TEACHERS =================
const getAllTeachers = (req, res) => {
  connection.query("SELECT * FROM teacher", (err, results) => {
    if (err) return res.status(500).json({ message: err.sqlMessage });
    res.json(results);
  });
};

// ================= GET TEACHER BY ID =================
const getTeacherById = (req, res) => {
  const { id } = req.params;

  connection.query(
    "SELECT * FROM teacher WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ message: err.sqlMessage });
      if (results.length === 0)
        return res.status(404).json({ message: "Teacher not found" });

      res.json(results[0]);
    },
  );
};

// ================= UPDATE TEACHER =================
const updateTeacher = (req, res) => {
  const { id } = req.params;
  const { name, email, password, phone, qualification, specialization, bio } =
    req.body;

  const image = req.file ? req.file.filename : null;
  const hashedPassword = password ? bcrypt.hashSync(password, 10) : null;

  let fields = [];
  let values = [];

  if (name) {
    fields.push("name=?");
    values.push(name);
  }
  if (email) {
    fields.push("email=?");
    values.push(email);
  }
  if (hashedPassword) {
    fields.push("password=?");
    values.push(hashedPassword);
  }
  if (phone) {
    fields.push("phone=?");
    values.push(phone);
  }
  if (qualification) {
    fields.push("qualification=?");
    values.push(qualification);
  }
  if (specialization) {
    fields.push("specialization=?");
    values.push(specialization);
  }
  if (bio) {
    fields.push("bio=?");
    values.push(bio);
  }
  if (image) {
    fields.push("image=?");
    values.push(image);
  }

  if (fields.length === 0)
    return res.status(400).json({ message: "No fields to update" });

  const sql = `UPDATE teacher SET ${fields.join(", ")} WHERE id=?`;
  values.push(id);

  connection.query(sql, values, (err) => {
    if (err) return res.status(500).json({ message: err.sqlMessage });
    res.json({ message: "Teacher updated successfully" });
  });
};

// ================= DELETE TEACHER =================
const deleteTeacher = (req, res) => {
  const { id } = req.params;

  connection.query("DELETE FROM teacher WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ message: err.sqlMessage });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Teacher not found" });

    res.json({ message: "Teacher deleted successfully" });
  });
};

// ================= TEACHER PROFILE =================
const teacherProfile = (req, res) => {
  try {
    if (!req.teacher) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    //  SAFE ID FETCH
    const teacherId =
      req.teacher?.teacherId ||
      req.teacher?.id ||
      req.user?.teacherId ||
      req.user?.userId;

    if (!teacherId) {
      return res.status(400).json({ message: "Teacher ID not found in token" });
    }

    const sql = "SELECT * FROM teacher WHERE id = ?";
    const statsSql = `
      SELECT
        COUNT(DISTINCT c.course_id) AS total_courses,
        COUNT(DISTINCT p.student_id) AS total_students,
        COUNT(DISTINCT s.syllabus_id) AS total_syllabus
      FROM course c
      LEFT JOIN payments p ON p.course_id = c.course_id
      LEFT JOIN syllabus s ON s.course_id = c.course_id
      WHERE c.teacher_id = ?
    `;

    connection.query(sql, [teacherId], (err, result) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: "Teacher not found" });
      }

      connection.query(statsSql, [teacherId], (statsErr, statsResult) => {
        if (statsErr) {
          console.error("Teacher stats error:", statsErr);
          return res.status(500).json({ message: "Database error" });
        }

        const statsRow = statsResult[0] || {};
        const stats = {
          total_courses: Number(statsRow.total_courses || 0),
          total_students: Number(statsRow.total_students || 0),
          total_syllabus: Number(statsRow.total_syllabus || 0),
        };

        res.json({
          profile: {
            ...result[0],
            total_courses: stats.total_courses,
            total_students: stats.total_students,
            total_syllabus: stats.total_syllabus,
          },
          stats,
        });
      });
    });
  } catch (error) {
    console.error("Teacher profile error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getMyCourses = (req, res) => {
  const teacherId = req.teacherId;

  const sql = "SELECT * FROM course WHERE teacher_id = ?";

  connection.query(sql, [teacherId], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error" });
    }

    res.json(result);
  });
};




const deletemyCourse = (req, res) => {
  const { id } = req.params;
  const teacherId = req.teacherId;

  const sql = `
    DELETE FROM course
    WHERE course_id=? AND teacher_id=?
  `;

  connection.query(sql, [id, teacherId],);
};

const updatemyCourse = (req, res) => {
  const { id } = req.params;
  const teacherId = req.teacherId;

  // ✅ IMPORTANT FIX
  const { course_name, description, duration } = req.body;

  const sql = `
    UPDATE course
    SET course_name = ?, description = ?, duration = ?
    WHERE course_id = ? AND teacher_id = ?
  `;

  connection.query(
    sql,
    [course_name, description, duration, id, teacherId],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (result.affectedRows === 0) {
        return res.status(403).json({
          message: "You can only update your own course",
        });
      }

      res.json({ message: "Course updated successfully" });
    }
  );
};

// ================= EXPORTS =================
module.exports = {
  signupTeacher,
  LoginTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  teacherProfile,
  getMyCourses,
  deletemyCourse,
  updatemyCourse,
};
             
