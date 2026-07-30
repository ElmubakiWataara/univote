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

// Register Organization
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
  const { name, email, phone, status, password } = req.body;
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

    // Validate password if provided
    if (password && password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Build dynamic update
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (name) {
      updateFields.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email) {
      updateFields.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramCount++}`);
      values.push(phone || null);
    }
    if (status) {
      updateFields.push(`status = $${paramCount++}`);
      values.push(status);
    }

    // Only update password if a new one is provided
    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(`password_hash = $${paramCount++}`);
      values.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `
      UPDATE organizations
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount} AND deleted_at IS NULL
      RETURNING id, name, email, phone, status, created_at, updated_at
      `,
      values,
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
          password_changed: !!(password && password.trim() !== ""),
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

//Global statistics
const getPlatformStats = async (req, res) => {
  try {
    const [voters, votes, admins, candidates, organizations] =
      await Promise.all([
        pool.query("SELECT COUNT(*) as total FROM voters"),
        pool.query("SELECT COUNT(*) as total FROM votes"),
        pool.query("SELECT COUNT(*) as total FROM admins"),
        pool.query("SELECT COUNT(*) as total FROM candidates"),
        pool.query(
          "SELECT COUNT(*) as total FROM organizations WHERE deleted_at IS NULL",
        ),
      ]);

    res.json({
      success: true,
      stats: {
        totalOrganizations: parseInt(organizations.rows[0].total),
        totalVoters: parseInt(voters.rows[0].total),
        totalVotes: parseInt(votes.rows[0].total),
        totalAdmins: parseInt(admins.rows[0].total),
        totalCandidates: parseInt(candidates.rows[0].total),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch platform statistics",
    });
  }
};

const resetOrganizationElection = async (req, res) => {
  const { id } = req.params;
  const ownerId = req.user.id;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Check organization exists
    const orgCheck = await client.query(
      "SELECT id, name FROM organizations WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );

    if (orgCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    // 2. Safety: Do not allow reset if election is currently active
    const electionCheck = await client.query(
      "SELECT is_active FROM election_settings WHERE organization_id = $1",
      [id],
    );

    if (electionCheck.rows[0]?.is_active === true) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message:
          "Cannot reset while election is active. Please close the election first.",
      });
    }

    // 3. Full clean-up (order is important because of foreign keys)
    await client.query("DELETE FROM votes WHERE organization_id = $1", [id]);
    await client.query("DELETE FROM tokens WHERE organization_id = $1", [id]);
    await client.query("DELETE FROM candidates WHERE organization_id = $1", [
      id,
    ]);
    await client.query("DELETE FROM voters WHERE organization_id = $1", [id]);
    await client.query("DELETE FROM admins WHERE organization_id = $1", [id]);

    // 4. Reset election_settings to default
    await client.query(
      `
      UPDATE election_settings
      SET 
        is_active = FALSE,
        title = NULL,
        logo_url = NULL,
        academic_year = NULL,
        description = NULL,
        updated_by = NULL,
        updated_at = NOW()
      WHERE organization_id = $1
      `,
      [id],
    );

    // 5. Audit log
    await client.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
      `,
      [
        "ORGANIZATION_FULL_RESET",
        ownerId,
        "owner",
        JSON.stringify({
          organization_id: id,
          organization_name: orgCheck.rows[0].name,
          note: "All election data (voters, candidates, votes, tokens, admins) has been cleared",
        }),
      ],
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: `Organization "${orgCheck.rows[0].name}" has been fully reset. All data cleared.`,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Full reset error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset organization data",
    });
  } finally {
    client.release();
  }
};

const getOrganizationAuditLogs = async (req, res) => {
  const { id } = req.params;
  const { limit = 100 } = req.query;

  try {
    // Optional: verify organization exists
    const orgCheck = await pool.query(
      "SELECT id, name FROM organizations WHERE id = $1 AND deleted_at IS NULL",
      [id],
    );

    if (orgCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    const result = await pool.query(
      `
      SELECT id, action, actor_id, actor_role, details, created_at
      FROM audit_logs
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [id, limit],
    );

    res.json({
      success: true,
      organization: orgCheck.rows[0],
      logs: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch audit logs",
    });
  }
};

module.exports = {
  ownerLogin,
  registerOrganization,
  getOrganizations,
  updateOrganization,
  deleteOrganization,
  getPlatformStats,
  resetOrganizationElection,
  getOrganizationAuditLogs,
};
