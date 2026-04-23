const connection = require("../../Model/dbConnect");

/* ================= HELPER ================= */
function attachFullImageUrl(rows, req) {
  if (!rows) return rows;
  const base = `${req.protocol}://${req.get("host")}`;
  return rows.map(r => {
    if (r.image_url) {
      let url = r.image_url;
      if (!url.startsWith("/")) url = "/" + url;
      return { ...r, image_url: base + url };
    }
    return r;
  });
}

/* ================= SEARCH COURSE ================= */
const searchCourse = async (req, res) => {
  const search = req.query.search || "";
  const searchValue = `%${search}%`;

  try {
    const sql = `
      SELECT DISTINCT c.course_id, c.course_name, c.description, c.image_url
      FROM course c
      LEFT JOIN syllabus s ON c.course_id = s.course_id
      WHERE c.course_name LIKE ? OR c.description LIKE ? OR s.topic_name LIKE ?
    `;

    connection.query(sql, [searchValue, searchValue, searchValue], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      const data = attachFullImageUrl(results, req);
      console.log("From MySQL");
      res.json(data);
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET SINGLE COURSE ================= */
const getSingleCourse = (req, res) => {
  const { id } = req.params;

  connection.query(
    "SELECT * FROM course WHERE course_id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.sqlMessage });
      if (result.length === 0)
        return res.status(404).json({ message: "Course not found" });

      const row = result[0];
      const attached = attachFullImageUrl([row], req)[0];
      res.json(attached);
    }
  );
};

/* ================= GET ALL COURSES ================= */
const getAllCourse = (req, res) => {
  connection.query("SELECT * FROM course", (err, results) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(attachFullImageUrl(results, req));
  });
};

/* ================= CREATE COURSE ================= */
const createCourse = (req, res) => {
  const { course_id, course_name, description, duration } = req.body;

  if (!req.teacherId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const teacherId = req.teacherId;
  const image_url = req.file ? `/uploads/${req.file.filename}` : null;

  const sql = `
    INSERT INTO course
    (course_id, course_name, description, duration, image_url, teacher_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  connection.query(
    sql,
    [course_id, course_name, description, duration, image_url, teacherId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });

      res.status(201).json({
        message: "Course added successfully",
        courseId: result.insertId,
      });
    }
  );
};

/* ================= UPDATE COURSE ================= */
const updateCourse = (req, res) => {
  const { id } = req.params;
  const { course_name, description, duration } = req.body;

  const image_url =
    req.file ? `/uploads/${req.file.filename}` : req.body.image_url || null;

  const sql = `
    UPDATE course
    SET course_name = ?, description = ?, duration = ?, image_url = ?
    WHERE course_id = ?
  `;

  connection.query(
    sql,
    [course_name, description, duration, image_url, id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.sqlMessage });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Course not found" });

      res.json({ message: "Course updated successfully" });
    }
  );
};

/* ================= DELETE COURSE ================= */
const deleteCourse = (req, res) => {
  const { id } = req.params;

  connection.query(
    "DELETE FROM course WHERE course_id = ?",
    [id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.sqlMessage });
      if (result.affectedRows === 0)
        return res.status(404).json({ message: "Course not found" });

      res.json({ message: "Course deleted successfully" });
    }
  );
};

/* ================= COURSES BY TEACHER ================= */
const getCoursesByTeacher = (req, res) => {
  const { teacher_id } = req.params;

  connection.query(
    "SELECT * FROM course WHERE teacher_id = ?",
    [teacher_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.sqlMessage });
      res.json(attachFullImageUrl(results, req));
    }
  );
};

/* ================= MY COURSES ================= */
const getMyCourses = (req, res) => {
  connection.query(
    "SELECT * FROM course WHERE teacher_id = ?",
    [req.teacherId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json(attachFullImageUrl(result, req));
    }
  );
};

/* ================= SEARCH BY TEACHER ================= */
const searchCourseByTeacherName = (req, res) => {
  const search = req.query.search || "";

  const sql = `
    SELECT c.*, t.name AS teacher_name
    FROM course c
    JOIN teacher t ON c.teacher_id = t.teacher_id
    WHERE t.name LIKE ?
  `;

  connection.query(sql, [`%${search}%`], (err, results) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(results);
  });
};

/* ================= COURSE DETAIL ================= */
const getCourseDetail = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT c.*, cp.original_price, cp.discount_price
    FROM course c
    LEFT JOIN course_prices cp ON c.course_id = cp.course_id
    WHERE c.course_id = ?
  `;

  connection.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(result[0]);
  });
};

/* ================= UPDATE PRICE ================= */
const updateCoursePrice = (req, res) => {
  const { id } = req.params;
  const { original_price, discount_price } = req.body;

  connection.query(
    "UPDATE course_prices SET original_price=?, discount_price=? WHERE course_id=?",
    [original_price, discount_price, id],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ message: "Price updated successfully" });
    }
  );
};

/* ================= PUBLIC COURSES ================= */
const getAllCoursesPublic = (req, res) => {
  const sql = `
    SELECT c.*, cp.original_price, cp.discount_price
    FROM course c
    LEFT JOIN course_prices cp
    ON c.course_id = cp.course_id
  `;

  connection.query(sql, (err, result) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(result);
  });
};

/* ================= EXPORT ================= */
module.exports = {
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
};


