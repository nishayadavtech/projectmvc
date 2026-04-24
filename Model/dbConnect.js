const mysql = require("mysql2");
require("dotenv").config();

/*
  ✅ Railway (production) → MYSQL_URL use होगा
  ✅ Local (development) → DB_HOST etc. use होंगे
*/

let connection;

if (process.env.MYSQL_URL) {
  // 🔥 Production (Render + Railway)
  connection = mysql.createConnection(process.env.MYSQL_URL);
} else {
  // 💻 Local (localhost)
  connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });
}

connection.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Database connected ✅");
  }
});

module.exports = connection;





