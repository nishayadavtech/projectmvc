const express = require("express");
const router = express.Router();

const {
  getRoleAssign,
  getUserRoles,
  assignRolesToUser,
  deleteRoleAssign
} = require("../../Controller/roleassignController/roleassign");

// Get all role assignments (optional)
router.get("/", getRoleAssign);

// Get roles assigned to a specific user
router.get("/userroles/:userid", getUserRoles);

// Assign roles to a user
router.post("/assign", assignRolesToUser);

// Delete all roles of a user (optional)
router.delete("/delete/:userid", deleteRoleAssign);

module.exports = router;


