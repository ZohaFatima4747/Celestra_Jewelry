const jwt = require("jsonwebtoken");

/**
 * Verifies a Bearer JWT token from the Authorization header.
 * Attaches decoded payload to req.user.
 */
const authMiddleware = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/**
 * Extends authMiddleware — additionally requires role === "admin".
 */
const adminAuth = (req, res, next) => {
  authMiddleware(req, res, () => {
    if (req.user.role !== "admin")
      return res.status(403).json({ message: "Admin only" });
    next();
  });
};

module.exports = { authMiddleware, adminAuth };
