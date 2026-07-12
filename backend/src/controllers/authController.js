const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const { generateToken } = require("../utils/jwt");

const adminLogin = async (req, res) => {
  const { email, username, password } = req.body;

  if (!password || (!email && !username)) {
    return res.status(400).json({
      success: false,
      message: "Email (or Username for Owner) and password are required",
    });
  }

  try {
    let result;

    // Try SuperAdmin first (email)
    if (email) {
      result = await pool.query(
        `
        SELECT id, email AS username, password_hash, 'superadmin' AS role,  id AS organization_id
        FROM organizations
        WHERE email = $1
        AND status = 'active';
        `,
        [email],
      );
    }

    // If not found, try regular Admin (email)
    if (!result || result.rows.length === 0) {
      result = await pool.query(
        `
        SELECT id, email AS username, password_hash, role, organization_id 
        FROM admins 
        WHERE email = $1
        `,
        [email || username],
      );
    }

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
      organization_id: user.organization_id,
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        organization_id: user.organization_id,
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

    const voterToken = generateToken(
      {
        id: tokenData.voter_id,
        role: "voter",
        voterId: tokenData.voter_id,
      },
      "15m",
    );

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
