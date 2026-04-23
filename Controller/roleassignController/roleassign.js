
const connection = require("../../Model/dbConnect");

// GET all role assignments
const getRoleAssign = (req, res) => {
  const query = "SELECT * FROM roleassign";
  connection.query(query, (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    return res.json(result);
  });
};

// GET roles for a specific user
const getUserRoles = (req, res) => {
  const { userid } = req.params;

  if (!userid) {
    return res.status(400).json({ error: "User ID is required" });
  }

  const query = "SELECT rid FROM roleassign WHERE userid = ?";
  connection.query(query, [userid], (err, result) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    // Send only array of role IDs
    const roleIds = result.map((r) => r.rid);
    return res.json(roleIds);
  });
};

// ✅ ASSIGN roles to user
const assignRolesToUser = (req, res) => {
  const { userid, rid } = req.body;

  // Validation
  if (!userid) {
    return res.status(400).json({ error: "User ID is required" });
  }
  if (!Array.isArray(rid)) {
    return res.status(400).json({ error: "Role IDs must be an array" });
  }

  // Admin check (Admin role must be exclusive)
  const adminRid = "4";
  if (rid.includes(adminRid) && rid.length > 1) {
    return res.status(400).json({ error: "Admin role must be exclusive" });
  }

  // Step 1: Delete old roles
  const deleteQuery = "DELETE FROM roleassign WHERE userid = ?";
  connection.query(deleteQuery, [userid], (delErr) => {
    if (delErr) return res.status(500).json({ error: delErr.sqlMessage });

    // If no roles are selected (empty array)
    if (rid.length === 0) {
      return res.json({ message: "All roles removed for user" });
    }

    // Step 2: Insert new roles
    const values = rid.map((role_id) => [userid, role_id]);
    const insertQuery = "INSERT INTO roleassign (userid, rid) VALUES ?";

    connection.query(insertQuery, [values], (insErr) => {
      if (insErr) return res.status(500).json({ error: insErr.sqlMessage });
      return res.json({ message: "Roles assigned successfully" });
    });
  });
};

// DELETE all roles of a user
const deleteRoleAssign = (req, res) => {
  const { userid } = req.params;

  if (!userid) {
    return res.status(400).json({ error: "User ID is required" });
  }

  connection.query("DELETE FROM roleassign WHERE userid = ?", [userid], (err) => {
    if (err) return res.status(500).json({ error: err.sqlMessage });
    return res.json({ message: "Roles deleted successfully" });
  });
};

module.exports = {
  getRoleAssign,
  getUserRoles,
  assignRolesToUser,
  deleteRoleAssign,
};
