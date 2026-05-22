// backend/src/controllers/voteController.js
const pool = require("../config/db");

const submitAllVotes = async (req, res) => {
  const { votes } = req.body; // Array of { candidate_id }
  const voterId = req.user.voterId;
  const ipAddress = req.ip || req.connection.remoteAddress;

  if (!votes || !Array.isArray(votes) || votes.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "No votes provided" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Check election is active
    const electionResult = await client.query(
      "SELECT is_active FROM election_settings LIMIT 1",
    );
    if (!electionResult.rows[0]?.is_active) {
      await client.query("ROLLBACK");
      return res
        .status(400)
        .json({ success: false, message: "Election is closed" });
    }

    // Get voter details once
    const voterResult = await client.query(
      "SELECT student_id, full_name FROM voters WHERE id = $1",
      [voterId],
    );

    if (voterResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ success: false, message: "Voter not found" });
    }

    const { student_id, full_name } = voterResult.rows[0];

    // Insert each vote with denormalized data
    for (const vote of votes) {
      const { candidate_id } = vote;

      // Get candidate details
      const candidateResult = await client.query(
        "SELECT name, position FROM candidates WHERE id = $1",
        [candidate_id],
      );

      if (candidateResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res
          .status(404)
          .json({ success: false, message: "Invalid candidate" });
      }

      const { name: candidate_name, position: candidate_position } =
        candidateResult.rows[0];

      // Prevent duplicate vote for same candidate
      const duplicateCheck = await client.query(
        "SELECT id FROM votes WHERE voter_id = $1 AND candidate_id = $2",
        [voterId, candidate_id],
      );

      if (duplicateCheck.rows.length > 0) continue;

      // Insert vote with all denormalized fields
      await client.query(
        `
        INSERT INTO votes (
          voter_id, 
          candidate_id, 
          student_id, 
          full_name, 
          candidate_name, 
          candidate_position, 
          ip_address
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
        [
          voterId,
          candidate_id,
          student_id,
          full_name,
          candidate_name,
          candidate_position,
          ipAddress,
        ],
      );
    }

    // Mark voter as voted (final submission)
    await client.query("UPDATE voters SET has_voted = TRUE WHERE id = $1", [
      voterId,
    ]);

    // Mark token as used
    await client.query(
      `
      UPDATE tokens 
      SET used = TRUE 
      WHERE voter_id = $1 AND used = FALSE
    `,
      [voterId],
    );

    // Audit log
    await client.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
    `,
      ["VOTES_SUBMITTED", voterId, "voter", { vote_count: votes.length }],
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "All votes submitted successfully. Thank you!",
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Submit votes error:", error);
    res.status(500).json({ success: false, message: "Failed to submit votes" });
  } finally {
    client.release();
  }
};

const getCandidates = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, position, bio, photo_url 
      FROM candidates 
      ORDER BY position, name
    `);
    res.json({ success: true, candidates: result.rows });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to load candidates" });
  }
};

module.exports = {
  submitAllVotes,
  getCandidates,
};
