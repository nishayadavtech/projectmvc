const authenticate = require("./authMiddleware");

module.exports = authenticate.authorizeRoles("admin");
