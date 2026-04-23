const bcrypt = require("bcrypt");
const mysql = require("mysql2");

// 🔹 Database Connection
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "1234", 
  database: "dash",
});

// 🔹 Connect DB
connection.connect((err) => {
  if (err) {
    console.log("DB Connection Error:", err);
    return;
  }
  console.log("Database Connected");
});

// 🔹 Main Function
(async () => {
  try {
    // 123456 ka hash generate karo
    const newHash = await bcrypt.hash("123456", 10);

    // Sab teachers ka password update karo
    connection.query(
      "UPDATE teacher SET password = ?",
      [newHash],
      (err, result) => {
        if (err) {
          console.log("Update Error:", err);
        } else {
          console.log("✅ All teachers password updated to 123456");
          console.log("Rows affected:", result.affectedRows);
        }

        connection.end(); 
      }
    );
  } catch (error) {
    console.log("Error:", error);
  }
})();