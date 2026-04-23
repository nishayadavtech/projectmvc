const connection = require("../../Model/dbConnect");
const path = require("path");
const fs = require("fs");

// helper for tutorial url
function attachTutorialUrl(rows, req) {
  if (!rows) return rows;
  const base = `${req.protocol}://${req.get("host")}`;
  return rows.map(r => {
    if (r.tutorial) {
      let url = r.tutorial;
      if (!url.startsWith("/")) url = "/" + url;
      return { ...r, tutorial: base + url, video: base + url };
    }
    return { ...r, video: null };
  });
}

function getUploadedTutorialPath(req, preferredFieldNames = []) {
  if (req.file) return `/uploads/${req.file.filename}`;

  const files = Array.isArray(req.files)
    ? req.files
    : Object.values(req.files || {}).flat();

  if (!files.length) return null;

  for (const fieldName of preferredFieldNames) {
    const match = files.find((file) => file.fieldname === fieldName);
    if (match) return `/uploads/${match.filename}`;
  }

  const genericMatch = files.find(
    (file) => file.fieldname === "tutorial" || file.fieldname === "video",
  );
  if (genericMatch) return `/uploads/${genericMatch.filename}`;

  return null;
}

function parseTopicsInput(body = {}) {
  if (!body.topics) return [];

  if (Array.isArray(body.topics)) return body.topics;

  if (typeof body.topics === "string") {
    try {
      const parsed = JSON.parse(body.topics);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      return [];
    }
  }

  return [];
}

function hasOwnValue(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function getBodyValue(body, ...keys) {
  for (const key of keys) {
    if (!hasOwnValue(body, key)) continue;

    const value = body[key];
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;

    return typeof value === "string" ? value.trim() : value;
  }

  return undefined;
}

function deleteUploadedFile(filePath) {
  if (!filePath) return;

  const normalizedPath = filePath.replace(/^\/+/, "");
  const absolutePath = path.join(__dirname, "../../", normalizedPath);

  if (fs.existsSync(absolutePath)) {
    fs.unlink(absolutePath, (err) => {
      if (err) console.error("Tutorial delete error:", err);
    });
  }
}


//  GET ALL SYLLABUS
const getAllSyllabus = (req, res) => {
  const query = "SELECT * FROM syllabus ORDER BY created_on DESC";
  connection.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    return res.json(attachTutorialUrl(result, req));
  });
};

const getMySyllabus = (req, res) => {
  const teacherId = req.teacherId; // ✅ FIX

  const sql = `
    SELECT s.*, c.course_name
    FROM syllabus s
    JOIN course c ON s.course_id = c.course_id
    WHERE c.teacher_id = ?
  `;

  connection.query(sql, [teacherId], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(attachTutorialUrl(result, req));
  });
};
const addSyllabus = (req, res) => {
  const topics = parseTopicsInput(req.body);

  if (topics.length) {
    const normalizedTopics = topics.map((topic, index) => {
      const tutorial = getUploadedTutorialPath(req, [
        topic.videoField,
        topic.tutorialField,
        topic.fileField,
        `video_${index}`,
        `tutorial_${index}`,
      ].filter(Boolean));

      return {
        syllabus_id: topic.syllabus_id,
        course_id: topic.course_id || req.body.course_id,
        subject_id: topic.subject_id || req.body.subject_id,
        topic_name: topic.topic_name,
        description: topic.description,
        tutorial,
      };
    });

    const invalidTopic = normalizedTopics.find(
      (topic) =>
        !topic.syllabus_id ||
        !topic.course_id ||
        !topic.subject_id ||
        !topic.topic_name ||
        !topic.description,
    );

    if (invalidTopic) {
      return res.status(400).json({
        error: "Each topic must include syllabus_id, course_id, subject_id, topic_name and description",
      });
    }

    const query = `
      INSERT INTO syllabus
      (syllabus_id, course_id, subject_id, topic_name, description, tutorial, created_on)
      VALUES ?
    `;

    const values = normalizedTopics.map((topic) => [
      topic.syllabus_id,
      topic.course_id,
      topic.subject_id,
      topic.topic_name,
      topic.description,
      topic.tutorial,
      new Date(),
    ]);

    return connection.query(query, [values], (err) => {
      if (err) return res.status(500).json({ error: err.sqlMessage });
      return res.json({
        message: "Topics added successfully",
        total_topics: normalizedTopics.length,
      });
    });
  }

  const { syllabus_id, course_id, subject_id, topic_name, description } = req.body;
  const tutorial = getUploadedTutorialPath(req, ["tutorial", "video"]);

  if (!syllabus_id || !course_id || !subject_id || !topic_name || !description) {
    return res.status(400).json({ error: "All required fields must be filled!" });
  }

  const query = `
    INSERT INTO syllabus (syllabus_id, course_id, subject_id, topic_name, description, tutorial, created_on)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;
connection.query(
    query,
    [syllabus_id, course_id, subject_id, topic_name, description, tutorial],
    (err) => {
      if (err) return res.status(500).json({ error: err.sqlMessage });
      return res.json({ message: "Syllabus added successfully" });
    }
  );
};


//======PUT====
const updateSyllabus = (req, res) => {
  const { id } = req.params;
  const tutorial = getUploadedTutorialPath(req, ["tutorial", "video"]);
  const selectQuery = `
    SELECT syllabus_id, course_id, subject_id, topic_name, description, tutorial
    FROM syllabus
    WHERE syllabus_id = ?
  `;
  connection.query(selectQuery, [id], (selectErr, rows) => {
    if (selectErr) return res.status(500).json({ error: selectErr.sqlMessage });
    if (!rows.length) {
      return res.status(404).json({ error: "Syllabus not found" });
    }

    const existingSyllabus = rows[0];
    const oldTutorial = existingSyllabus.tutorial;
    const course_id = getBodyValue(req.body, "course_id", "courseId") ?? existingSyllabus.course_id;
    const subject_id = getBodyValue(req.body, "subject_id", "subjectId") ?? existingSyllabus.subject_id;
    const topic_name = getBodyValue(req.body, "topic_name", "topicName") ?? existingSyllabus.topic_name;
    const description = getBodyValue(req.body, "description") ?? existingSyllabus.description;
    const finalTutorial = tutorial || oldTutorial;

    if (!course_id || !subject_id || !topic_name || !description) {
      return res.status(400).json({ error: "All required fields must be filled!" });
    }

    const updateQuery = `
      UPDATE syllabus
      SET course_id=?, subject_id=?, topic_name=?, description=?, tutorial=?
      WHERE syllabus_id=?
    `;

    connection.query(
      updateQuery,
      [course_id, subject_id, topic_name, description, finalTutorial, id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.sqlMessage });
        if (result.affectedRows === 0)
          return res.status(404).json({ error: "Syllabus not found" });

        if (tutorial && oldTutorial && oldTutorial !== tutorial) {
          deleteUploadedFile(oldTutorial);
        }

        return res.json({
          message: "Syllabus updated successfully",
          syllabus: {
            syllabus_id: existingSyllabus.syllabus_id,
            course_id,
            subject_id,
            topic_name,
            description,
            tutorial: finalTutorial,
            video: finalTutorial,
          },
        });
      }
    );
  });
};
// ========patch=====
const patchSyllabus = (req, res) => {
  const { id } = req.params;
  const tutorialPath = getUploadedTutorialPath(req, ["tutorial", "video"]);

  //If no file uploaded
  if (!tutorialPath) {
    return res.status(400).json({ message: "Please upload a tutorial file!" });
  }

  const selectQuery = "SELECT tutorial FROM syllabus WHERE syllabus_id = ?";
  connection.query(selectQuery, [id], (selectErr, rows) => {
    if (selectErr) {
      return res.status(500).json({ error: selectErr.sqlMessage });
    }
    if (!rows.length) {
      return res.status(404).json({ error: "Syllabus not found" });
    }

    const oldTutorial = rows[0].tutorial;
    const query = `UPDATE syllabus SET tutorial = ? WHERE syllabus_id = ?`;
    connection.query(query, [tutorialPath, id], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.sqlMessage });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Syllabus not found" });
      }

      if (oldTutorial && oldTutorial !== tutorialPath) {
        deleteUploadedFile(oldTutorial);
      }

      res.json({
        message: "Tutorial updated successfully ",
        tutorial: tutorialPath,
        video: tutorialPath,
      });
    });
  });
};

const deleteTutorial = (req, res) => {
  const { id } = req.params;

  const selectQuery = "SELECT tutorial FROM syllabus WHERE syllabus_id = ?";
  connection.query(selectQuery, [id], (selectErr, rows) => {
    if (selectErr) return res.status(500).json({ error: selectErr.sqlMessage });
    if (!rows.length) {
      return res.status(404).json({ error: "Syllabus not found" });
    }

    const tutorial = rows[0].tutorial;
    if (!tutorial) {
      return res.json({ message: "Video already deleted" });
    }

    const updateQuery = "UPDATE syllabus SET tutorial = NULL WHERE syllabus_id = ?";
    connection.query(updateQuery, [id], (err, result) => {
      if (err) return res.status(500).json({ error: err.sqlMessage });
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Syllabus not found" });
      }

      deleteUploadedFile(tutorial);
      return res.json({ message: "Video deleted successfully" });
    });
  });
};

//====DELETE SYLLABUS====
const deleteSyllabus = (req, res) => {
  const { id } = req.params;

  const query = "DELETE FROM syllabus WHERE syllabus_id = ?";
  connection.query(query, [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Syllabus not found" });
    return res.json({ message: "Syllabus deleted successfully" });
  });
};


const searchSyllabus = (req, res) => {
  const search = req.query.search || "";
  const searchValue = `%${search}%`;

  const sql = `
    SELECT s.*, c.course_name
    FROM syllabus s
    JOIN course c ON s.course_id = c.course_id
    WHERE c.course_name LIKE ? OR s.topic_name LIKE ?
  `;

  connection.query(sql, [searchValue, searchValue], (err, results) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    res.json(attachTutorialUrl(results, req));
  });
};

const syllabusloginteacher = (req, res) => {
  const teacherId = req.teacherId;

  const sql = `
    SELECT s.*, c.course_name
    FROM syllabus s
    JOIN course c ON s.course_id = c.course_id
    WHERE c.teacher_id = ?
  `;

  connection.query(sql, [teacherId], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }

    res.json(attachTutorialUrl(result, req));
  });
};

const getSyllabusByCourse = (req, res) => {
  const { course_id } = req.query;

  const sql = `
    SELECT *
    FROM syllabus
    WHERE course_id = ?
  `;

  connection.query(sql, [course_id], (err, result) => {
    if (err) {
      console.error("Syllabus fetch error:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(attachTutorialUrl(result, req));
  });
};

module.exports = {
  getAllSyllabus,
  addSyllabus,
  updateSyllabus,
  patchSyllabus,
  deleteTutorial,
  deleteSyllabus,
  getMySyllabus,
  syllabusloginteacher,
  searchSyllabus,
  getSyllabusByCourse,
};
