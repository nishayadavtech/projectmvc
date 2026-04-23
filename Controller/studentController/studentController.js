const connection = require("../../Model/dbConnect");

function normalizePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) ? price : 0;
}


const signupStudent = (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields required" });
  }

  const sql =
    "INSERT INTO student (name, email, password) VALUES (?, ?, ?)";

  connection.query(
    sql,
    [name, email, password],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(400).json({ message: "Email already exists" });
        }
        return res.status(500).json({ message: "Signup failed" });
      }

      res.json({ message: "Student registered successfully" });
    }
  );
};

/* ================= LOGIN ================= */
const loginStudent = (req, res) => {
  const { email, password } = req.body;

  const sql =
    "SELECT * FROM student WHERE email = ? AND password = ?";

  connection.query(sql, [email, password], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length === 0) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    res.json({
      message: "Login successful",
      student: result[0],
    });
  });
};

/* ================= GET ALL ================= */
const getAllStudents = (req, res) => {
  connection.query("SELECT * FROM student", (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching students" });
    }

    res.json(result);
  });
};

/* ================= GET SINGLE ================= */
const getStudentById = (req, res) => {
  const { id } = req.params;

  const sql = "SELECT * FROM student WHERE student_id = ?";

  connection.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Error fetching student" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json(result[0]);
  });
};

/* ================= DELETE ================= */
const deleteStudent = (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM student WHERE student_id = ?";

  connection.query(sql, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Delete failed" });
    }

    res.json({ message: "Student deleted successfully" });
  });
};

const getStudentDashboard = (req, res) => {
  const studentId = req.params.id;

  if (!studentId) {
    return res.status(400).json({ message: "student_id is required" });
  }

  const studentSql = `
    SELECT student_id, name, email, created_on
    FROM student
    WHERE student_id = ?
  `;

  const purchasedSql = `
    SELECT
      p.id,
      p.course_id,
      p.student_id,
      p.payment_id,
      p.order_id,
      p.created_at,
      c.course_name,
      c.description,
      c.duration,
      c.image_url,
      cp.original_price,
      cp.discount_price
    FROM payments p
    LEFT JOIN course c ON p.course_id = c.course_id
    LEFT JOIN course_prices cp ON p.course_id = cp.course_id
    WHERE p.student_id = ?
    ORDER BY p.created_at DESC, p.id DESC
  `;

  const cartSql = `
    SELECT
      cart.cartid,
      cart.course_id,
      c.course_name,
      cp.original_price,
      cp.discount_price
    FROM cart
    LEFT JOIN course c ON cart.course_id = c.course_id
    LEFT JOIN course_prices cp ON cart.course_id = cp.course_id
    WHERE cart.user_id = ?
    ORDER BY cart.cartid DESC
  `;

  connection.query(studentSql, [studentId], (studentErr, studentRows) => {
    if (studentErr) {
      return res.status(500).json({ message: "Error fetching student" });
    }

    if (studentRows.length === 0) {
      return res.status(404).json({ message: "Student not found" });
    }

    connection.query(purchasedSql, [studentId], (purchasedErr, purchasedRows) => {
      if (purchasedErr) {
        return res.status(500).json({ message: "Error fetching purchased courses" });
      }

      connection.query(cartSql, [studentId], (cartErr, cartRows) => {
        if (cartErr) {
          return res.status(500).json({ message: "Error fetching cart summary" });
        }

        const purchasedCourses = purchasedRows.map((row) => {
          const originalPrice = normalizePrice(row.original_price);
          const discountPrice = normalizePrice(row.discount_price);
          const finalPrice = discountPrice > 0 ? discountPrice : originalPrice;

          return {
            ...row,
            original_price: originalPrice,
            discount_price: discountPrice,
            final_price: finalPrice,
          };
        });

        const cartItems = cartRows.map((row) => {
          const originalPrice = normalizePrice(row.original_price);
          const discountPrice = normalizePrice(row.discount_price);
          const finalPrice = discountPrice > 0 ? discountPrice : originalPrice;

          return {
            ...row,
            original_price: originalPrice,
            discount_price: discountPrice,
            final_price: finalPrice,
          };
        });

        const purchasedTotal = purchasedCourses.reduce(
          (sum, course) => sum + course.final_price,
          0
        );
        const cartTotal = cartItems.reduce((sum, item) => sum + item.final_price, 0);

        return res.json({
          success: true,
          student: studentRows[0],
          purchasedCourses,
          purchasedCount: purchasedCourses.length,
          purchasedTotal,
          cartItems,
          cartCount: cartItems.length,
          cartTotal,
        });
      });
    });
  });
};

module.exports = {
  signupStudent,
  loginStudent,
  getAllStudents,
  getStudentById,
  deleteStudent,
  getStudentDashboard,
};
