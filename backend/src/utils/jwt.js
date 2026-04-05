// backend/src/utils/jwt.js
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "super-secret-jwt-key-2026-change-this";

const generateToken = (payload, expiresIn = "1h") => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

module.exports = { generateToken, verifyToken };
