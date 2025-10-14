const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  console.log("Auth middleware called for:", req.path);
  const token = req.header("Authorization")?.replace("Bearer ", "");
  console.log("Token present:", !!token);

  if (!token) {
    console.log("No token found");
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    console.log("User authenticated:", req.user.id);
    next();
  } catch (err) {
    console.error("JWT verification failed:", err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
}

module.exports = authMiddleware;
