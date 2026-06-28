const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const toggleElection = async (req, res) => {
  const { is_active } = req.body;
  const adminId = req.user.id;

  if (typeof is_active !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "is_active must be true or false",
    });
  }

  try {
    const result = await pool.query(
      `
      UPDATE election_settings
      SET
        is_active = $1,
        updated_by = $2,
        updated_at = NOW()
      WHERE id = 1
      RETURNING is_active
      `,
      [is_active, adminId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Election settings not found",
      });
    }

    await pool.query(
      `
      INSERT INTO audit_logs
      (
        action,
        actor_id,
        actor_role,
        details
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )
      `,
      [
        "ELECTION_TOGGLE",
        adminId,
        req.user.role,
        JSON.stringify({
          is_active,
        }),
      ],
    );

    res.json({
      success: true,
      message: `Election is now ${is_active ? "ACTIVE" : "CLOSED"}`,
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("Toggle election error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update election status",
    });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(
      `
      SELECT id, action, actor_id, actor_role, details, created_at 
      FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT $1
    `,
      [limit],
    );

    res.json({
      success: true,
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

const getAllAdmins = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, username, role, created_at 
      FROM admins 
      ORDER BY role DESC, username
    `);

    res.json({
      success: true,
      admins: result.rows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch admins" });
  }
};

// Create New Admin (Super Admin Only)
const createAdmin = async (req, res) => {
  const { username, password, role } = req.body;
  const superAdminId = req.user.id;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "Username and password are required",
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

    // allowed roles (security control)
    const allowedRoles = ["admin", "superadmin"];
    const finalRole = allowedRoles.includes(role) ? role : "admin";

    const result = await pool.query(
      `
      INSERT INTO admins (username, password_hash, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
      RETURNING id, username, role
      `,
      [username, hashedPassword, finalRole],
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
      });
    }
    //only admins to add admins
    if (role === "superadmin" && req.user.role !== "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Only superadmins can create superadmins",
      });
    }

    // audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
      `,
      [
        "ADMIN_CREATED",
        superAdminId,
        "superadmin",
        { new_admin: username, role: finalRole },
      ],
    );

    return res.json({
      success: true,
      message: "New admin created successfully",
      admin: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Failed to create admin",
    });
  }
};
// Update Admin (mainly for password reset)
const updateAdmin = async (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;
  const superAdminId = req.user.id;

  if (!username && !password) {
    return res.status(400).json({
      success: false,
      message: "At least username or password is required",
    });
  }

  try {
    let updateFields = [];
    let values = [];
    let paramCount = 1;

    if (username) {
      updateFields.push(`username = $${paramCount++}`);
      values.push(username.trim());
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(`password_hash = $${paramCount++}`);
      values.push(hashedPassword);
    }

    values.push(id); // For WHERE clause

    const result = await pool.query(
      `
      UPDATE admins 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount} AND role = 'admin'
      RETURNING id, username, role
      `,
      values,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found or cannot be modified",
      });
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
    `,
      [
        "ADMIN_UPDATED",
        superAdminId,
        "superadmin",
        { admin_id: id, updated_fields: Object.keys(req.body) },
      ],
    );

    res.json({
      success: true,
      message: "Admin updated successfully",
      admin: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update admin" });
  }
};

// Delete Admin
const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const superAdminId = req.user.id;

  try {
    // Prevent deleting superadmin or self
    const adminCheck = await pool.query(
      "SELECT role FROM admins WHERE id = $1",
      [id],
    );

    if (adminCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    if (adminCheck.rows[0].role === "superadmin") {
      return res.status(403).json({
        success: false,
        message: "Cannot delete Super Admin account",
      });
    }

    const result = await pool.query(
      "DELETE FROM admins WHERE id = $1 AND role = 'admin' RETURNING id, username",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found or cannot be deleted",
      });
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
    `,
      [
        "ADMIN_DELETED",
        superAdminId,
        "superadmin",
        { deleted_admin_id: id, username: result.rows[0].username },
      ],
    );

    res.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete admin" });
  }
};

const getElectionSettings = async (req, res) => {
  try {
    let result = await pool.query(
      `
      SELECT
        id,
        title,
        logo_url,
        academic_year,
        description,
        is_active,
        updated_by,
        updated_at
      FROM election_settings
      WHERE id = 1
      `,
    );

    if (result.rows.length === 0) {
      await pool.query(
        `
        INSERT INTO election_settings
        (
          id,
          is_active
        )
        VALUES
        (
          1,
          FALSE
        )
        ON CONFLICT (id) DO NOTHING
        `,
      );

      result = await pool.query(
        `
        SELECT *
        FROM election_settings
        WHERE id = 1
        `,
      );
    }

    res.json({
      success: true,
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("Get election settings error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch election settings",
    });
  }
};

const updateElectionConfig = async (req, res) => {
  const adminId = req.user.id;

  let { title, academic_year, description } = req.body;

  try {
    const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const existing = await pool.query(
      "SELECT * FROM election_settings WHERE id = 1",
    );

    const current = existing.rows[0];

    const finalLogo = logoUrl ?? current.logo_url;

    const result = await pool.query(
      `
        UPDATE election_settings
        SET
            title = $1,
            academic_year = $2,
            description = $3,
            logo_url = $4,
            updated_by = $5,
            updated_at = NOW()
        WHERE id = 1
        RETURNING *
        `,
      [
        title ?? current.title,
        academic_year ?? current.academic_year,
        description ?? current.description,
        finalLogo,
        adminId,
      ],
    );

    await pool.query(
      `
      INSERT INTO audit_logs
      (
        action,
        actor_id,
        actor_role,
        details
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4
      )
      `,
      [
        "ELECTION_CONFIG_UPDATED",
        adminId,
        req.user.role,
        JSON.stringify({
          title,
          academic_year,
        }),
      ],
    );

    res.json({
      success: true,
      message: "Election configuration updated",
      settings: result.rows[0],
    });
  } catch (error) {
    console.error("Update election config error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update election configuration",
    });
  }
};

module.exports = {
  toggleElection,
  getAuditLogs,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  getElectionSettings,
  updateElectionConfig,
};
