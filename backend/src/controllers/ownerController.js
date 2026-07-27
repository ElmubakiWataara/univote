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

// Get All Organizations (Owner Only)
const getOrganizations = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        email,
        phone,
        status,
        created_at,
        updated_at
      FROM organizations 
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      organizations: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch organizations",
    });
  }
};

// Update Organization
const updateOrganization = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, status } = req.body;
  const ownerId = req.user.id;

  try {
    // Check if organization exists and is not soft-deleted
    const existing = await pool.query(
      "SELECT * FROM organizations WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Validate status if provided
    if (status && !["pending", "active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be pending, active, or suspended",
      });
    }

    const result = await pool.query(
      `
      UPDATE organizations
      SET 
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        status = COALESCE($4, status),
        updated_at = NOW()
      WHERE id = $5 AND deleted_at IS NULL
      RETURNING id, name, email, phone, status, created_at, updated_at
      `,
      [name || null, email || null, phone || null, status || null, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
      `,
      [
        "ORGANIZATION_UPDATED",
        ownerId,
        "owner",
        JSON.stringify({
          organization_id: id,
          name,
          email,
          phone,
          status,
        }),
      ],
    );

    res.json({
      success: true,
      message: "Organization updated successfully",
      organization: result.rows[0],
    });
  } catch (error) {
    console.error("Update organization error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update organization",
    });
  }
};

// Soft Delete Organization
const deleteOrganization = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  try {
    // Check if election is currently active
    const electionCheck = await pool.query(
      "SELECT is_active FROM election_settings WHERE organization_id = $1",
      [id],
    );

    if (electionCheck.rows[0]?.is_active === true) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete organization while election is active. Please close the election first.",
      });
    }

    // Soft delete
    const result = await pool.query(
      `
      UPDATE organizations
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, name
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Organization not found or already deleted",
      });
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
      `,
      [
        "ORGANIZATION_DELETED",
        ownerId,
        "owner",
        JSON.stringify({ organization_id: id, name: result.rows[0].name }),
      ],
    );

    res.json({
      success: true,
      message: "Organization deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete organization",
    });
  }
};

module.exports = {
  ownerLogin,
  registerOrganization,
  getOrganizations,
  updateOrganization,
  deleteOrganization,
};
