// backend/src/controllers/voteController.js
const pool = require("../config/db");

const castVote = async (req, res) => {
  const { candidate_id } = req.body;
  const voterId = req.user.voterId;
  const ipAddress = req.ip || req.connection.remoteAddress;

  if (!candidate_id) {
    return res.status(400).json({
      success: false,
      message: "Candidate ID is required",
    });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Check if election is active
    const electionResult = await client.query(
      "SELECT is_active FROM election_settings LIMIT 1",
    );

    if (!electionResult.rows[0]?.is_active) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "Election is closed",
      });
    }

    // 2. Check if candidate exists
    const candidateCheck = await client.query(
      "SELECT id FROM candidates WHERE id = $1",
      [candidate_id],
    );

    if (candidateCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Invalid candidate",
      });
    }

    // 3. Prevent duplicate vote for the same candidate by the same voter
    const duplicateCheck = await client.query(
      "SELECT id FROM votes WHERE voter_id = $1 AND candidate_id = $2",
      [voterId, candidate_id],
    );

    if (duplicateCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "You have already voted for this candidate",
      });
    }

    // 4. Record the vote
    await client.query(
      `
      INSERT INTO votes (voter_id, candidate_id, ip_address)
      VALUES ($1, $2, $3)
    `,
      [voterId, candidate_id, ipAddress],
    );

    // 5. Log the vote
    await client.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
    `,
      [
        "VOTE_CAST",
        voterId,
        "voter",
        JSON.stringify({ candidate_id, ip_address: ipAddress }),
      ],
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Vote recorded successfully",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Vote casting error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record your vote. Please try again.",
    });
  } finally {
    client.release();
  }
};

// Get candidates (unchanged - grouped by position on frontend)
const getCandidates = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, position, bio, photo_url 
      FROM candidates 
      ORDER BY position, name
    `);

    res.json({
      success: true,
      candidates: result.rows,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to load candidates" });
  }
};

module.exports = {
  castVote,
  getCandidates,
};
