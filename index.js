// const express = require("express");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");
// const dotenv = require("dotenv");
// const path = require("path");
// const fs = require("fs");




// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 5500;

// /* ================= MIDDLEWARE ================= */

// app.use(
//   cors({
//     origin: ["http://localhost:3000", "http://localhost:3001"],
//     credentials: true,
//   })
// );

// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));
// app.use(cookieParser());

// /* ================= UPLOADS STATIC FOLDER ================= */

// // Absolute uploads path
// const uploadsPath = path.join(__dirname, "uploads");

// // Create folder if not exists
// if (!fs.existsSync(uploadsPath)) {
//   fs.mkdirSync(uploadsPath, { recursive: true });
//   console.log("Uploads folder created");
// }

// // CORRECT STATIC SETUP
// app.use("/uploads", express.static(uploadsPath));

// /* ================= 🔥 VIDEO UPLOAD (ADDED) ================= */

// const multer = require("multer");

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, uploadsPath);
//   },
//   filename: function (req, file, cb) {
//     cb(null, Date.now() + "-" + file.originalname);
//   },
// });

// const upload = multer({ storage });

// // upload route
// app.post("/upload-video", upload.single("video"), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ error: "No file uploaded" });
//     }

//     res.json({
//       video_url: `http://localhost:${PORT}/uploads/${req.file.filename}`,
//       video_name: req.file.originalname,
//     });
//   } catch (err) {
//     console.error("Upload Error:", err);
//     res.status(500).json({ error: "Upload failed" });
//   }
// });

// /* ================= ROUTES ================= */

// app.use("/course", require("./Route/course/courseroute"));
// app.use("/users", require("./Route/user/userroute"));
// app.use("/role", require("./Route/role/roleroute"));
// app.use("/roleassign", require("./Route/Assignroute/Assignroute"));
// app.use("/userprofile", require("./Route/userprofile/userprofileroute"));
// app.use("/subjects", require("./Route/subject/subjectroute"));
// app.use("/syllabus", require("./Route/syllabus/syllabusroute"));
// app.use("/teacher", require("./Route/teacher/teacherroute"));
// app.use("/cart", require("./Route/cart/cartroute"));
// app.use("/payment", require("./Route/payment/paymentroute"));
// app.use("/courseprice", require("./Route/coursepriceroute/coursepriceroute"));
// app.use("/student", require("./Route/studentRoute/studentroute"));

// /* ================= TEST ROUTE ================= */

// app.get("/", (req, res) => {
//   res.send("Server running successfully...");
// });

// /* ================= START SERVER ================= */
// const db = mysql.createConnection(process.env.MYSQL_URL);
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const mysql = require("mysql2");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5500;

/* ================= MIDDLEWARE ================= */

app.use(cors({
  origin: [
    "http://localhost:3000",   // local testing
    "https://studentmodule.vercel.app" // ✅ FIXED (https added)
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ================= DATABASE CONNECTION ================= */

const db = mysql.createConnection(process.env.MYSQL_URL);

db.connect((err) => {
  if (err) {
    console.log("DB Error:", err);
  } else {
    console.log("Database Connected ✅");
  }
});

/* ================= UPLOADS STATIC FOLDER ================= */

const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("Uploads folder created");
}

app.use("/uploads", express.static(uploadsPath));

/* ================= VIDEO UPLOAD ================= */

const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

app.post("/upload-video", upload.single("video"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    res.json({
      video_url: `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`,
      video_name: req.file.originalname,
    });
  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

/* ================= ROUTES ================= */

app.use("/course", require("./Route/course/courseroute"));
app.use("/users", require("./Route/user/userroute"));
app.use("/role", require("./Route/role/roleroute"));
app.use("/roleassign", require("./Route/Assignroute/Assignroute"));
app.use("/userprofile", require("./Route/userprofile/userprofileroute"));
app.use("/subjects", require("./Route/subject/subjectroute"));
app.use("/syllabus", require("./Route/syllabus/syllabusroute"));
app.use("/teacher", require("./Route/teacher/teacherroute"));
app.use("/cart", require("./Route/cart/cartroute"));
app.use("/payment", require("./Route/payment/paymentroute"));
app.use("/courseprice", require("./Route/coursepriceroute/coursepriceroute"));
app.use("/student", require("./Route/studentRoute/studentroute"));

/* ================= TEST ROUTE ================= */

app.get("/", (req, res) => {
  res.send("Server running successfully...");
});

/* ================= START SERVER ================= */

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});