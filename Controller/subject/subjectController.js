const connection = require("../../Model/dbConnect");
const path = require("path");
const fs = require("fs");

// GET all subjects
const getAllSubjects = (req, res) => {
  const query = "SELECT * FROM subjects ORDER BY created_on DESC";
  connection.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(results);
  });
};

// ADD new subject with image
const addSubjects = (req, res) => {
  const { subject_id, course_id, subject_name, description } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!subject_id || !subject_name || !description) {
    return res.status(400).json({ error: "Please fill all required fields." });
  }

  const query = `
    INSERT INTO subjects (subject_id, course_id, subject_name, description, image)
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(
    query,
    [subject_id, course_id, subject_name, description, image],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.sqlMessage });
      res.json({ message: "Subject added successfully", subject_id });
    }
  );
};

// DELETE subject
const deleteSubjects = (req, res) => {
  const { subject_id } = req.params;

  // First get image filename to delete it
  const getQuery = "SELECT image FROM subjects WHERE subject_id = ?";
  connection.query(getQuery, [subject_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    if (results.length === 0) return res.status(404).json({ message: "Subject not found" });

    const imageFile = results[0].image ? path.join(__dirname, "../../uploads", results[0].image) : null;

    // Delete from DB
    const deleteQuery = "DELETE FROM subjects WHERE subject_id = ?";
    connection.query(deleteQuery, [subject_id], (err, result) => {
      if (err) return res.status(500).json({ error: err.sqlMessage });

      // Delete image file from uploads folder
      if (imageFile && fs.existsSync(imageFile)) {
        fs.unlinkSync(imageFile);
      }

      res.json({ message: "Subject deleted successfully" });
    });
  });
};

module.exports = {
  getAllSubjects,
  addSubjects,
  deleteSubjects,
};
