// backend/src/controllers/authController.js
const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");

const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Username and password required" });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, password_hash, role FROM admins WHERE username = $1",
      [username],
    );

    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken({
      id: admin.id,
      username: admin.username,
      role: admin.role,
    });

    res.json({
      success: true,
      message: "Admin login successful",
      token,
      user: {
        id: admin.id,
        username: admin.username,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const verifyVoterToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "Token is required" });
  }

  try {
    // Check if token exists, not used, and not expired
    const result = await pool.query(
      `
      SELECT t.id, t.voter_id, t.used, t.expires_at, v.student_id, v.full_name, v.has_voted
      FROM tokens t
      JOIN voters v ON t.voter_id = v.id
      WHERE t.token_value = $1
    `,
      [token],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const tokenData = result.rows[0];

    if (tokenData.used) {
      return res
        .status(400)
        .json({ success: false, message: "Token already used" });
    }

    if (new Date(tokenData.expires_at) < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "Token has expired" });
    }

    if (tokenData.has_voted) {
      return res
        .status(400)
        .json({ success: false, message: "You have already voted" });
    }

    // Mark token as used (we'll do this atomically later with vote)
    // For now, we issue JWT

    const voterToken = generateToken(
      {
        id: tokenData.voter_id,
        role: "voter",
        voterId: tokenData.voter_id,
      },
      "15m",
    ); // Short expiry for voters

    res.json({
      success: true,
      message: "Token verified successfully",
      token: voterToken,
      voter: {
        id: tokenData.voter_id,
        studentId: tokenData.student_id,
        fullName: tokenData.full_name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { adminLogin, verifyVoterToken };
