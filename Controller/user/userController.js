const connection = require("../../Model/dbConnect");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

// ======================= NODEMAILER SETUP =======================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ny6957880@gmail.com", 
    pass: "msgy gtgi lxlb keua", 
  },
});

// Optional verify
transporter.verify((err, success) => {
  if (err) console.error("Email config error:", err);
  else console.log("Email server is ready");
});

function normalizeRoles(roleResult) {
  return roleResult.map((roleRow) => roleRow.rname).filter(Boolean);
}

function fetchTeacherByEmail(email) {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT id, name, email FROM teacher WHERE email = ? LIMIT 1",
      [email],
      (err, result) => {
        if (err) return reject(err);
        resolve(result[0] || null);
      },
    );
  });
}

// ======================= GET ALL USERS =======================
const getuser = (req, res) => {
  const query = "SELECT * FROM user";
  connection.query(query, (error, result) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });
    res.json(result);
  });
};

// ======================= GET USER COUNT =======================
const getusercount = (req, res) => {
  const query =
    "SELECT status, COUNT(*) total FROM user GROUP BY status ORDER BY status ASC";
  connection.query(query, (error, result) => {
    if (error) return res.status(500).json({ error: error.sqlMessage });
    res.json(result);
  });
};

// ======================= POST USER =======================
const postuser = (req, res) => {
  const data = { ...req.body };

  // address field ko ignore karna
  if (data.hasOwnProperty("address")) {
    delete data.address;
  }

  bcrypt.hash(data.password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).send("Error hashing password");

    data.password = hashedPassword;

    const sql = "INSERT INTO user SET ?";
    connection.query(sql, [data], async (error, result) => {
      if (error) return res.status(500).json({ error: error.sqlMessage });

      // Welcome Email
      const mailOptions = {
        from: "ny6957880@gmail.com",
        to: data.email,
        subject: "Welcome to Our App",
        html: `
          <h2>Hi ${data.username || "User"},</h2>
          <p>Thank you for registering with us. Your account has been created successfully.</p>
          <br/>
          <p>Regards,<br/>Team</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent to:", data.email);
      } catch (mailErr) {
        console.error("Error sending email:", mailErr.message);
      }

      res.json({
        Status: "Success",
        result,
        message: "User registered & email sent!",
      });
    });
  });
};


const loginUser = (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM `user` WHERE email = ?";

  connection.query(sql, [email], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    // USER NOT FOUND → SIGNUP PAGE
    if (result.length === 0) {
      return res.json({
        success: false,
        redirectTo: "/signup",
        email,
      });
    }

    const user = result[0];

    // bcrypt COMPARE (THIS WILL NOW WORK)
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: "Password check error" });
      }

      if (!isMatch) {
        return res.status(401).json({ error: "Invalid password" });
      }

      // ROLE FETCH
      const roleQuery = `
        SELECT r.rname
        FROM roleassign ra
        JOIN role r ON ra.rid = r.rid
        WHERE ra.userid = ?
      `;

      connection.query(roleQuery, [user.userid], async (err, roleResult) => {
        if (err) {
          return res.status(500).json({ error: "Role fetch error" });
        }

        const userRolesArray = normalizeRoles(roleResult);
        let teacher = null;

        if (userRolesArray.some((role) => role.toLowerCase() === "teacher")) {
          try {
            teacher = await fetchTeacherByEmail(user.email);
          } catch (teacherErr) {
            console.error("Teacher fetch error:", teacherErr);
            return res.status(500).json({ error: "Teacher fetch error" });
          }
        }

        // JWT
        const token = jwt.sign(
          {
            id: teacher?.id || user.userid,
            userId: user.userid,
            userid: user.userid,
            teacherId: teacher?.id || null,
            email: user.email,
            username: user.username,
            roles: userRolesArray,
            role: userRolesArray,
          },
          process.env.JWT_SECRET || "Nisha",
          { expiresIn: "1d" }
        );

        return res.json({
          success: true,
          token,
          user: {
            userid: user.userid,
            email: user.email,
            username: user.username,
            roles: userRolesArray,
            teacherId: teacher?.id || null,
          },
          redirectTo: "/teacher/dashboard",
        });
      });
    });
  });
};

// =========================signup


const signupUser = (req, res) => {
  const { email, password } = req.body;

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: "Hashing failed" });

    const sql = "INSERT INTO user (email, password) VALUES (?, ?)";

    connection.query(sql, [email, hash], (err, result) => {
      if (err) {
        return res.status(500).json({ error: "User already exists" });
      }

      const userid = result.insertId;

      //  DEFAULT ROLE ASSIGN (teacher)
      connection.query(
        "INSERT INTO roleassign (userid, rid) VALUES (?, ?)",
        [userid, 1], // assume 1 = teacher
        () => {
          return res.json({
            success: true,
            message: "Signup success",
          });
        }
      );
    });
  });
};



// ======================= DELETE USER =======================

const deleteuser = (req, res) => {
  const { userid } = req.params;

  if (!userid) {
    return res.status(400).json({ success: false, message: "User ID required" });
  }

  const query = "DELETE FROM user WHERE userid = ?";
  connection.query(query, [userid], (error, result) => {
    if (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ success: false, message: error.sqlMessage });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({ success: true, message: "User deleted successfully" });
  });
};

// ======================= UPDATE USER =======================
const putuser = (req, res) => {
  const { username, email, password } = req.body;
  const userid = req.params.userid;

  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) return res.status(500).send("Error hashing password");

    const query =
      "UPDATE user SET username = ?, email = ?, password = ? WHERE userid = ?";
    connection.query(
      query,
      [username, email, hashedPassword, userid],
      (error, result) => {
        if (error) return res.status(500).json({ error: error.sqlMessage });
        res.json(result);
      }
    );
  });
};

// ======================= PATCH USER STATUS =======================
const patchuserstatus = (req, res) => {
  const query = "UPDATE user SET status = ? WHERE userid = ?";
  connection.query(
    query,
    [req.body.status, req.params.userid],
    (error, result) => {
      if (error) return res.status(500).json({ error: error.sqlMessage });
      res.json(result);
    }
  );
};

// ================== CHANGE PASSWORD ==================
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userid = req.user.userid;
    const username = req.user.username;
    const email = req.user.email;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .send({ success: false, message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).send({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    connection.query(
      "SELECT * FROM user WHERE userid = ?",
      [userid],
      async (err, results) => {
        if (err)
          return res
            .status(500)
            .send({ success: false, message: err.sqlMessage });

        if (!results.length) {
          return res
            .status(404)
            .send({ success: false, message: "User not found" });
        }

        const user = results[0];
        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) {
          return res
            .status(400)
            .send({ success: false, message: "Old password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        connection.query(
          "UPDATE user SET password = ? WHERE userid = ?",
          [hashedPassword, userid],
          async (err2) => {
            if (err2)
              return res
                .status(500)
                .send({ success: false, message: err2.sqlMessage });

            try {
              await transporter.sendMail({
                from: "ny6957880@gmail.com",
                to: email,
                subject: "Password Changed",
                html: `<h3>Hello ${username},</h3><p>Your password has been changed successfully.</p>`,
              });

              console.log("Password change email sent to:", email);
              return res.send({
                success: true,
                message: "Password updated and email sent",
              });
            } catch (mailErr) {
              console.error("Error sending email:", mailErr);
              return res.send({
                success: true,
                message: "Password updated but email not sent",
                error: mailErr.message,
              });
            }
          }
        );
      }
    );
  } catch (error) {
    console.error("Change password error:", error);
    return res
      .status(500)
      .send({ success: false, message: "Internal Server Error" });
  }
};

// ================== EXPORTS ==================
module.exports = {
  getuser,
  getusercount,
  postuser,
  loginUser,
  signupUser,
  deleteuser,
  putuser,
  patchuserstatus,
  changePassword,
};
