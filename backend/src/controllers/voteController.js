// backend/src/controllers/voteController.js
const pool = require("../config/db");

// ==================== NEW: Submit Complete Ballot ====================
const submitBallot = async (req, res) => {
  const { votes } = req.body;
  const voterId = req.user.voterId;
  const ipAddress = req.ip || req.connection.remoteAddress;

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
    const voter = voterResult.rows[0];

    // Process each vote
    if (votes && votes.length > 0) {
      for (const { candidate_id } of votes) {
        if (!candidate_id) continue;

        // Get candidate details
        const candidateResult = await client.query(
          "SELECT name, position FROM candidates WHERE id = $1",
          [candidate_id],
        );

        if (candidateResult.rows.length === 0) continue;

        const candidate = candidateResult.rows[0];

        // Check if already voted for this position
        const existing = await client.query(
          `
          SELECT id FROM votes 
          WHERE voter_id = $1 
          AND candidate_id IN (SELECT id FROM candidates WHERE position = $2)
          `,
          [voterId, candidate.position],
        );

        if (existing.rows.length > 0) continue;

        // INSERT with denormalized data
        await client.query(
          `
          INSERT INTO votes (
            voter_id, candidate_id, ip_address, 
            student_id, full_name, 
            candidate_name, candidate_position
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            voterId,
            candidate_id,
            ipAddress,
            voter.student_id,
            voter.full_name,
            candidate.name,
            candidate.position,
          ],
        );
      }
    }

    // Mark voter as has_voted (even if fully skipped)
    await client.query("UPDATE voters SET has_voted = TRUE WHERE id = $1", [
      voterId,
    ]);

    //votes details for audit log
    const voteDetails = [];
    if (votes && votes.length > 0) {
      for (const { candidate_id } of votes) {
        if (!candidate_id) continue;

        const candResult = await client.query(
          "SELECT name, position FROM candidates WHERE id = $1",
          [candidate_id],
        );

        if (candResult.rows.length > 0) {
          voteDetails.push({
            candidate_id: candidate_id,
            candidate_name: candResult.rows[0].name,
            position: candResult.rows[0].position,
          });
        }
      }
    }

    // Audit Log
    await client.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
      `,
      [
        "BALLOT_SUBMITTED",
        voterId,
        "voter",
        JSON.stringify({
          voter_id: voterId,
          student_id: voter.student_id,
          ip_address: ipAddress,
          votes_cast: votes?.length || 0,
          full_skipped: !votes || votes.length === 0,
          votes: voteDetails,
        }),
      ],
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Ballot submitted successfully",
      votes_cast: votes?.length || 0,
      full_abstention: !votes || votes.length === 0,
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Ballot submission error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit ballot" });
  } finally {
    client.release();
  }
};

const getCandidates = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, name, position, bio, photo_url, yes_or_no 
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
  // castVote,
  getCandidates,
  submitBallot, // ← Added
};
