const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { upload } = require("../services/uploadService");

const toggleElection = async (req, res) => {
  const { is_active } = req.body;
  const adminId = req.user.id;
  const organizationId = req.user.organization_id;

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
      WHERE organization_id = $3
      RETURNING is_active;
      `,
      [is_active, adminId, organizationId],
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
        details,
        organization_id
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5
      )
      `,
      [
        "ELECTION_TOGGLE",
        adminId,
        req.user.role,
        JSON.stringify({
          is_active,
        }),
        organizationId,
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
  const organizationId = req.user.organization_id;

  try {
    const limit = parseInt(req.query.limit) || 10;

    const result = await pool.query(
      `
      SELECT 
        id,
        action,
        actor_id,
        actor_role,
        details,
        created_at
      FROM audit_logs
      WHERE organization_id = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [organizationId, limit],
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
  const organizationId = req.user.organization_id;

  try {
    const result = await pool.query(
      `
      SELECT id, username, email, role, created_at 
      FROM admins 
      WHERE organization_id = $1
      ORDER BY role DESC, username
      `,
      [organizationId],
    );

    res.json({
      success: true,
      admins: result.rows,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch admins",
    });
  }
};

// Create New Admin (Super Admin Only)
const createAdmin = async (req, res) => {
  const { name, email, password } = req.body;
  const superAdminId = req.user.id;
  const organizationId = req.user.organization_id;

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
      INSERT INTO admins (
        username,
        email,
        password_hash,
        role,
        organization_id
      )
      VALUES ($1, $2, $3, 'admin', $4)
      ON CONFLICT (email, organization_id) DO NOTHING
      RETURNING id, username, email, role
      `,
      [name, email, hashedPassword, organizationId],
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (
        action,
        actor_id,
        actor_role,
        details,
        organization_id
      )
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        "ADMIN_CREATED",
        superAdminId,
        req.user.role,
        {
          new_admin: name,
          email: email,
          role: "admin",
          organization_id: organizationId,
        },
        organizationId,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
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
  const organizationId = req.user.organization_id;

  if (!username && !password) {
    return res.status(400).json({
      success: false,
      message: "At least name or password is required",
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

      const hashedPassword = await bcrypt.hash(password, 10);

      updateFields.push(`password_hash = $${paramCount++}`);
      values.push(hashedPassword);
    }

    // WHERE id
    values.push(id);

    // WHERE organization_id
    values.push(organizationId);

    const result = await pool.query(
      `
      UPDATE admins
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      AND organization_id = $${paramCount + 1}
      AND role = 'admin'
      RETURNING id, username, email, role
      `,
      values,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found or cannot be modified",
      });
    }

    await pool.query(
      `
      INSERT INTO audit_logs (
        action,
        actor_id,
        actor_role,
        details,
        organization_id
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        "ADMIN_UPDATED",
        superAdminId,
        req.user.role,
        JSON.stringify({
          admin_id: id,
          updated_fields: Object.keys(req.body),
        }),
        organizationId,
      ],
    );

    res.json({
      success: true,
      message: "Admin updated successfully",
      admin: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to update admin",
    });
  }
};

// Delete Admin
const deleteAdmin = async (req, res) => {
  const { id } = req.params;
  const superAdminId = req.user.id;
  const organizationId = req.user.organization_id;

  try {
    // Check admin exists in this organization
    const adminCheck = await pool.query(
      `
      SELECT role, username
      FROM admins
      WHERE id = $1
      AND organization_id = $2
      `,
      [id, organizationId],
    );

    if (adminCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM admins
      WHERE id = $1
      AND organization_id = $2
      AND role = 'admin'
      RETURNING id, username, email
      `,
      [id, organizationId],
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
      INSERT INTO audit_logs (
        action,
        actor_id,
        actor_role,
        details,
        organization_id
      )
      VALUES ($1,$2,$3,$4,$5)
      `,
      [
        "ADMIN_DELETED",
        superAdminId,
        req.user.role,
        JSON.stringify({
          deleted_admin_id: id,
          name: result.rows[0].username,
          email: result.rows[0].email,
        }),
        organizationId,
      ],
    );

    res.json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to delete admin",
    });
  }
};

const updateElectionConfig = async (req, res) => {
  const adminId = req.user.id;
  const organizationId = req.user.organization_id;

  let { title, academic_year, description } = req.body;

  try {
    let logoUrl = null;
    if (req.file) {
      logoUrl = await upload(req.file);
    }
    // const logoUrl = req.file ? `/uploads/${req.file.filename}` : null;
    // let photoUrl = null;
    // if (req.file) {
    //   photoUrl = await upload(req.file);

    const existing = await pool.query(
      "SELECT * FROM election_settings WHERE organization_id = $1",
      [organizationId],
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
        WHERE organization_id = $6
        RETURNING *
        `,
      [
        title ?? current.title,
        academic_year ?? current.academic_year,
        description ?? current.description,
        finalLogo,
        adminId,
        organizationId,
      ],
    );

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Election settings not found for this organization",
      });
    }

    await pool.query(
      `
      INSERT INTO audit_logs
      (
        action,
        actor_id,
        actor_role,
        details,
        organization_id
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        $5
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
        organizationId,
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
  // getElectionSettings,
  updateElectionConfig,
};
