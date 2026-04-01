const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_EXPIRES_IN = String(process.env.JWT_EXPIRES_IN || "12h").trim();
const JWT_ISSUER = String(process.env.JWT_ISSUER || "verdex-api").trim();
const JWT_AUDIENCE = String(
  process.env.JWT_AUDIENCE || "verdex-clients",
).trim();

function isStrongPassword(password) {
  const value = String(password || "");
  return (
    value.length >= 10 &&
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

function createToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
      name: user.name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      algorithm: "HS256",
    },
  );
}

async function register(req, res) {
  try {
    const { name, role, identifier, password } = req.body;

    if (!name || !role || !identifier || !password) {
      return res.status(400).json({ message: "Please fill all fields." });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 10 chars and include upper, lower, number, and symbol.",
      });
    }

    if (!["Farmer", "Retailer"].includes(role)) {
      return res.status(400).json({ message: "Please select a valid role." });
    }

    const normalizedIdentifier = String(identifier).trim().toLowerCase();

    const existingUser = await User.findOne({
      identifier: normalizedIdentifier,
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "User already exists. Please login." });
    }

    const user = await User.create({
      name: String(name).trim(),
      role,
      identifier: normalizedIdentifier,
      password,
    });

    const token = createToken(user);

    return res.status(201).json({
      message: "Registration successful ✅",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        identifier: user.identifier,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not register. Please try again." });
  }
}

async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Please enter login details." });
    }

    const normalizedIdentifier = String(identifier).trim().toLowerCase();
    const user = await User.findOne({ identifier: normalizedIdentifier });

    if (!user) {
      return res.status(401).json({ message: "Invalid login details." });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid login details." });
    }

    const token = createToken(user);

    return res.json({
      message: "Login successful ✅",
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        identifier: user.identifier,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Could not login. Please try again." });
  }
}

function getMe(req, res) {
  return res.json({ user: req.user });
}

module.exports = { register, login, getMe };
