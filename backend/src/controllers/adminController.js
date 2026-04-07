// backend/src/controllers/adminController.js
const pool = require("../config/db");
const crypto = require("crypto");

const updateVoter = async (req, res) => {
  const { id } = req.params;
  const { student_id, full_name, department, email } = req.body;
  const adminId = req.user.id;

  try {
    // Check current voter status
    const current = await pool.query(
      "SELECT has_voted FROM voters WHERE id = $1",
      [id],
    );
    const hasVoted = current.rows[0]?.has_voted;

    let query = `
      UPDATE voters 
      SET full_name = $1, department = $2, email = $3
    `;
    let params = [full_name, department, email];

    // Only allow student_id change if voter has not voted
    if (!hasVoted && student_id) {
      query += `, student_id = $4`;
      params.push(student_id);
    }

    query += ` WHERE id = $${params.length + 1} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Voter not found" });
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
    `,
      ["VOTER_UPDATED", adminId, req.user.role, { voter_id: id, full_name }],
    );

    res.json({
      success: true,
      message: "Voter updated successfully",
      voter: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update voter" });
  }
};

const deleteVoter = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    // Check if voter has voted
    const check = await pool.query(
      "SELECT has_voted FROM voters WHERE id = $1",
      [id],
    );
    if (check.rows[0]?.has_voted) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete voter who has already voted",
      });
    }

    await pool.query("DELETE FROM voters WHERE id = $1", [id]);

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
    `,
      ["VOTER_DELETED", adminId, req.user.role, { voter_id: id }],
    );

    res.json({ success: true, message: "Voter deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete voter" });
  }
};
const registerVoter = async (req, res) => {
  const { student_id, full_name, department, email } = req.body;
  const adminId = req.user.id;

  if (!student_id || !full_name) {
    return res.status(400).json({
      success: false,
      message: "Student ID and full name are required",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO voters (student_id, full_name, department, email)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (student_id) DO NOTHING
      RETURNING id, student_id, full_name
    `,
      [student_id.toUpperCase(), full_name, department, email],
    );

    if (result.rows.length === 0) {
      return res
        .status(409)
        .json({ success: false, message: "Student ID already exists" });
    }

    // Log action
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
    `,
      ["VOTER_REGISTERED", adminId, req.user.role, { student_id, full_name }],
    );

    res.json({
      success: true,
      message: "Voter registered successfully",
      voter: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to register voter" });
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
      .json({ success: false, message: "Failed to fetch candidates" });
  }
};

// Add this function (or replace the existing one)
const addCandidate = async (req, res) => {
  const { name, position, bio } = req.body;
  const adminId = req.user.id;

  // Debug log to see what is actually being received
  // console.log("Received data:", req.body);
  // console.log("Received file:", req.file);

  if (!name || !position) {
    return res.status(400).json({
      success: false,
      message: "Candidate name and position are required",
    });
  }

  try {
    // Handle photo upload (if using multer or similar)
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `
      INSERT INTO candidates (name, position, bio, photo_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, position, bio, photo_url
    `,
      [name.trim(), position.trim(), bio || null, photoUrl],
    );

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
    `,
      ["CANDIDATE_ADDED", adminId, req.user.role, { name, position }],
    );

    res.json({
      success: true,
      message: "Candidate added successfully",
      candidate: result.rows[0],
    });
  } catch (error) {
    console.error("Add candidate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add candidate",
    });
  }
};

//Update candidate
const updateCandidate = async (req, res) => {
  const { id } = req.params;
  const { name, position, bio } = req.body;
  const adminId = req.user.id;

  if (!name || !position) {
    return res.status(400).json({
      success: false,
      message: "Candidate name and position are required",
    });
  }

  try {
    // Check if candidate has any votes
    const voteCheck = await pool.query(
      "SELECT COUNT(*) as vote_count FROM votes WHERE candidate_id = $1",
      [id],
    );

    if (parseInt(voteCheck.rows[0].vote_count) > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot edit candidate because votes have already been cast for them.",
      });
    }

    const result = await pool.query(
      `
      UPDATE candidates 
      SET name = $1, position = $2, bio = $3
      WHERE id = $4
      RETURNING id, name, position, bio, photo_url
    `,
      [name.trim(), position.trim(), bio || null, id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
    `,
      [
        "CANDIDATE_UPDATED",
        adminId,
        req.user.role,
        { candidate_id: id, name, position },
      ],
    );

    res.json({
      success: true,
      message: "Candidate updated successfully",
      candidate: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update candidate" });
  }
};

//Delete Candidate
const deleteCandidate = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    // Check if candidate has any votes
    const voteCheck = await pool.query(
      "SELECT COUNT(*) as vote_count FROM votes WHERE candidate_id = $1",
      [id],
    );

    if (parseInt(voteCheck.rows[0].vote_count) > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete candidate because votes have already been cast for them.",
      });
    }

    const result = await pool.query(
      "DELETE FROM candidates WHERE id = $1 RETURNING name",
      [id],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
    `,
      [
        "CANDIDATE_DELETED",
        adminId,
        req.user.role,
        { candidate_id: id, name: result.rows[0].name },
      ],
    );

    res.json({
      success: true,
      message: "Candidate deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete candidate" });
  }
};

const generateVoterToken = async (req, res) => {
  const { student_id } = req.body;
  const adminId = req.user.id;
  const adminRole = req.user.role;

  if (!student_id) {
    return res.status(400).json({
      success: false,
      message: "Student ID is required",
    });
  }

  try {
    // 1. Check if election is active
    const electionCheck = await pool.query(
      "SELECT is_active FROM election_settings LIMIT 1",
    );

    if (!electionCheck.rows[0]?.is_active) {
      return res.status(400).json({
        success: false,
        message: "Election is currently closed by Super Admin",
      });
    }

    // 2. Check if voter exists and hasn't voted yet
    const voterResult = await pool.query(
      `SELECT id, full_name, has_voted 
       FROM voters 
       WHERE student_id = $1`,
      [student_id],
    );

    if (voterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Voter with this Student ID not found",
      });
    }

    const voter = voterResult.rows[0];

    if (voter.has_voted) {
      return res.status(400).json({
        success: false,
        message: "This student has already voted",
      });
    }

    // 3. Generate secure random token (64 hex characters)
    const tokenValue = crypto.randomBytes(32).toString("hex");

    // 4. Set 15 minutes expiry
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 5. Save token to database
    const tokenInsert = await pool.query(
      `
      INSERT INTO tokens (voter_id, token_value, generated_by, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING id, token_value, expires_at
    `,
      [voter.id, tokenValue, adminId, expiresAt],
    );

    // 6. Log this action
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details)
      VALUES ($1, $2, $3, $4)
    `,
      [
        "TOKEN_GENERATED",
        adminId,
        adminRole,
        {
          student_id: student_id,
          voter_name: voter.full_name,
          token_id: tokenInsert.rows[0].id,
        },
      ],
    );

    // 7. Return token to admin
    res.json({
      success: true,
      message:
        "Token generated successfully. Please write it down and give to the student.",
      token: tokenValue,
      expires_in: 900, // 15 minutes
      voter_name: voter.full_name,
      student_id: student_id,
    });
  } catch (error) {
    console.error("Generate token error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while generating token",
    });
  }
};

// Get all voters (for admin dashboard)
const getAllVoters = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, student_id, full_name, department, has_voted, created_at 
      FROM voters 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      count: result.rows.length,
      voters: result.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to fetch voters" });
  }
};

module.exports = {
  registerVoter,
  generateVoterToken,
  getAllVoters,
  getCandidates,
  addCandidate,
  updateVoter,
  deleteVoter,
  updateCandidate,
  deleteCandidate,
};
