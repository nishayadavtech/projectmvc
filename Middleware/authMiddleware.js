require("dotenv").config();
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

function getTokenFromRequest(req) {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
}

function normalizeRoles(payload = {}) {
  const roles = payload.roles || payload.role || [];
  return Array.isArray(roles) ? roles : [roles];
}

const authenticate = (req, res, next) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const roles = normalizeRoles(decoded);
    const userId = decoded.userId || decoded.userid || decoded.id || null;
    const teacherId =
      decoded.teacherId || decoded.id || decoded.userid || null;

    req.auth = decoded;
    req.user = {
      ...decoded,
      userId,
      userid: userId,
      teacherId,
      roles,
      role: roles,
    };
    req.teacher = {
      ...decoded,
      id: teacherId,
      teacherId,
      roles,
      role: roles,
    };
    req.teacherId = teacherId;

    next();
  } catch (err) {
    console.log("JWT Verify Error:", err.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

authenticate.authorizeRoles = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles.map((role) =>
    String(role).toLowerCase(),
  );

  return (req, res, next) => {
    const roles = normalizeRoles(req.user);

    const hasAccess = roles.some((role) =>
      normalizedAllowedRoles.includes(String(role).toLowerCase()),
    );

    if (!hasAccess) {
      return res.status(403).json({ error: "Access denied" });
    }

    next();
  };
};

module.exports = authenticate;
