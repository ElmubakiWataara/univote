const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const { generateToken } = require("../utils/jwt");

// Owner Login
const ownerLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
    });
  }

  try {
    const result = await pool.query(
      "SELECT id, username, password_hash FROM owners WHERE username = $1",
      [username],
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const owner = result.rows[0];
    const isMatch = await bcrypt.compare(password, owner.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken({
      id: owner.id,
      username: owner.username,
      role: "owner",
    });

    res.json({
      success: true,
      message: "Owner login successful",
      token,
      user: {
        id: owner.id,
        username: owner.username,
        role: "owner",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Register Organization/SuperAdmin
const registerOrganization = async (req, res) => {
  const { name, email, phone, password } = req.body;
  const ownerId = req.user.id;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Name, email and password are required",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 6 characters",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO organizations (name, email, password_hash, phone, created_by, status)
      VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id, name, email, status
      `,
      [name, email, hashedPassword, phone || null, ownerId],
    );

    // Create default election_settings row
    await pool.query(
      "INSERT INTO election_settings (organization_id) VALUES ($1)",
      [result.rows[0].id],
    );

    res.json({
      success: true,
      message: "Organization registered successfully",
      organization: result.rows[0],
      note: "Super Admin can now login with the provided email and password",
    });
  } catch (error) {
    console.error(error);
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to register organization",
    });
  }
};

module.exports = { registerOrganization, ownerLogin };
