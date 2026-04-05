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

    // 2. Check if voter has already voted
    const voterCheck = await client.query(
      "SELECT has_voted FROM voters WHERE id = $1",
      [voterId],
    );

    if (voterCheck.rows[0]?.has_voted) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        success: false,
        message: "You have already cast your vote",
      });
    }

    // 3. Check if candidate exists
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

    // 4. Record the vote
    await client.query(
      `
      INSERT INTO votes (voter_id, candidate_id, ip_address)
      VALUES ($1, $2, $3)
    `,
      [voterId, candidate_id, ipAddress],
    );

    // 5. Mark voter as voted
    await client.query("UPDATE voters SET has_voted = TRUE WHERE id = $1", [
      voterId,
    ]);

    // 6. Mark the token as used (Fixed version)
    await client.query(
      `
      UPDATE tokens 
      SET used = TRUE 
      WHERE voter_id = $1 
        AND used = FALSE 
        AND expires_at > NOW()
        AND id = (
          SELECT id FROM tokens 
          WHERE voter_id = $1 
            AND used = FALSE 
            AND expires_at > NOW()
          ORDER BY created_at DESC 
          LIMIT 1
        )
    `,
      [voterId],
    );

    // 7. Log the vote
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
      message: "Vote cast successfully. Thank you for voting!",
      confirmation: `VOTE-${Date.now().toString().slice(-6)}`,
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

// Get candidates (unchanged)
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
