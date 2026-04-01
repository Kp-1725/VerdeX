const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_ISSUER = String(process.env.JWT_ISSUER || "verdex-api").trim();
const JWT_AUDIENCE = String(
  process.env.JWT_AUDIENCE || "verdex-clients",
).trim();

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Please login first." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithms: ["HS256"],
    });
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res
        .status(401)
        .json({ message: "Session expired. Please login again." });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Invalid session. Please login again." });
  }
}

module.exports = { requireAuth };
