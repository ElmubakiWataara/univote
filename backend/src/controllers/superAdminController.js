// backend/src/controllers/superAdminController.js
const pool = require("../config/db");

const toggleElection = async (req, res) => {
  const { is_active, allow_live_results } = req.body;
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
      SET is_active = $1, 
          allow_live_results = $2,
          updated_by = $3,
          updated_at = NOW()
      WHERE id = 1
      RETURNING is_active, allow_live_results
    `,
      [is_active, allow_live_results || false, adminId],
    );

    // Log the action
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
    `,
      [
        "ELECTION_TOGGLE",
        adminId,
        "superadmin",
        JSON.stringify({
          is_active,
          allow_live_results: allow_live_results || false,
        }),
      ],
    );

    res.json({
      success: true,
      message: `Election is now ${is_active ? "ACTIVE" : "CLOSED"}`,
      settings: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update election status" });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, action, actor_id, actor_role, details, created_at 
      FROM audit_logs 
      ORDER BY created_at DESC 
      LIMIT 100
    `);

    res.json({
      success: true,
      logs: result.rows,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch audit logs" });
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

module.exports = {
  toggleElection,
  getAuditLogs,
  getAllAdmins,
};
