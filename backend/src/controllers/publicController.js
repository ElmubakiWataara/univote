const pool = require("../config/db");

const getPublicElectionInfo = async (req, res) => {
  const organizationId = req.query.organization_id;

  if (!organizationId) {
    return res.status(400).json({
      success: false,
      message: "Organization ID is required",
    });
  }

  try {
    const result = await pool.query(
      `
      SELECT title, logo_url, academic_year, description, is_active
      FROM election_settings
      WHERE organization_id = $1
      `,
      [organizationId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Election not found",
      });
    }

    res.json({
      success: true,
      election: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch election information",
    });
  }
};

module.exports = {
  getPublicElectionInfo,
};
