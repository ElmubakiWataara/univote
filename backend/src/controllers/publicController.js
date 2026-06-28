const pool = require("../config/db");

const getPublicElectionInfo = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        title,
        logo_url,
        academic_year,
        description,
        is_active
      FROM election_settings
      WHERE id = 1
      `,
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Election settings not found",
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
