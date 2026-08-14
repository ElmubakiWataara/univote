const pool = require("../config/db");
const crypto = require("crypto");
const {
  toTitleCase,
  toUpperCase,
  isValidEmail,
  isValidStudentId,
} = require("../helpers/stringHelpers");
const { upload: uploadFile } = require("../services/uploadService");

const updateVoter = async (req, res) => {
  const { id } = req.params;
  let { student_id, full_name, department, email } = req.body;
  const adminId = req.user.id;
  const organizationId = req.user.organization_id; // From JWT

  try {
    // Check current voter status (scoped)
    const current = await pool.query(
      "SELECT has_voted FROM voters WHERE id = $1 AND organization_id = $2",
      [id, organizationId],
    );

    const hasVoted = current.rows[0]?.has_voted;

    // Validation
    if (full_name) full_name = toTitleCase(full_name.trim());

    if (email && !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    let query = `
      UPDATE voters 
      SET full_name = $1, department = $2, email = $3
    `;
    let params = [full_name, department, email];

    // Only allow student_id change if voter has not voted
    if (!hasVoted && student_id) {
      student_id = student_id.trim().toUpperCase();
      if (!isValidStudentId(student_id)) {
        return res.status(400).json({
          success: false,
          message:
            "Student ID can only contain letters and numbers (no spaces or special characters)",
        });
      }
      query += `, student_id = $4`;
      params.push(student_id);
    }

    query += ` WHERE id = $${params.length + 1} AND organization_id = $${params.length + 2} RETURNING *`;
    params.push(id, organizationId);

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Voter not found" });
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details, organization_id)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        "VOTER_UPDATED",
        adminId,
        req.user.role,
        { voter_id: id, full_name },
        organizationId,
      ],
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

// Delete Voter (Scoped)
const deleteVoter = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const organizationId = req.user.organization_id;

  try {
    // Check if voter has voted (scoped)
    const check = await pool.query(
      "SELECT has_voted FROM voters WHERE id = $1 AND organization_id = $2",
      [id, organizationId],
    );

    if (check.rows[0]?.has_voted) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete voter who has already voted",
      });
    }

    await pool.query(
      "DELETE FROM voters WHERE id = $1 AND organization_id = $2",
      [id, organizationId],
    );

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details, organization_id)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        "VOTER_DELETED",
        adminId,
        req.user.role,
        { voter_id: id },
        organizationId,
      ],
    );

    res.json({ success: true, message: "Voter deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete voter" });
  }
};

// Register Voter (Scoped)
const registerVoter = async (req, res) => {
  let { student_id, full_name, department, email } = req.body;
  const adminId = req.user.id;
  const organizationId = req.user.organization_id;

  if (!student_id || !full_name) {
    return res.status(400).json({
      success: false,
      message: "Student ID and full name are required",
    });
  }

  // Validation
  student_id = student_id.trim().toUpperCase();
  if (!isValidStudentId(student_id)) {
    return res.status(400).json({
      success: false,
      message:
        "Student ID can only contain letters and numbers (no spaces or special characters)",
    });
  }

  full_name = toTitleCase(full_name.trim());

  if (email && !isValidEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Invalid email format",
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO voters (student_id, full_name, department, email, organization_id)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (organization_id, student_id) DO NOTHING
      RETURNING id, student_id, full_name
    `,
      [student_id, full_name, department, email, organizationId],
    );

    if (result.rows.length === 0) {
      return res.status(409).json({
        success: false,
        message: "Student ID already exists in this organization",
      });
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details, organization_id)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        "VOTER_REGISTERED",
        adminId,
        req.user.role,
        { student_id, full_name },
        organizationId,
      ],
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

//bulk upload and registration
const bulkRegisterVoters = async (req, res) => {
  const adminId = req.user.id;
  const organizationId = req.user.organization_id;
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  }

  try {
    const csv = require("csv-parser");
    const { Readable } = require("stream");

    const results = [];

    // Read CSV from Multer memory buffer
    await new Promise((resolve, reject) => {
      Readable.from(file.buffer)
        .pipe(csv())
        .on("data", (row) => results.push(row))
        .on("end", resolve)
        .on("error", reject);
    });

    const errors = [];
    let successCount = 0;

    // Process each voter
    for (const row of results) {
      try {
        const student_id = (row.student_id || "").trim().toUpperCase();

        const full_name = toTitleCase((row.full_name || "").trim());

        const department = (row.department || "").trim();
        const email = (row.email || "").trim();

        // Validate required fields
        if (!student_id || !full_name) {
          errors.push({
            row,
            reason: "Missing student_id or full_name",
          });
          continue;
        }

        // Validate student ID
        if (!isValidStudentId(student_id)) {
          errors.push({
            row,
            reason:
              "Invalid student_id format (only letters and numbers allowed)",
          });
          continue;
        }

        // Validate email
        if (email && !isValidEmail(email)) {
          errors.push({
            row,
            reason: "Invalid email format",
          });
          continue;
        }

        // Insert voter
        const dbResult = await pool.query(
          `
          INSERT INTO voters
            (student_id, full_name, department, email, organization_id)
          VALUES
            ($1, $2, $3, $4, $5)
          ON CONFLICT (organization_id, student_id)
          DO NOTHING
          RETURNING id, student_id, full_name
          `,
          [student_id, full_name, department, email, organizationId],
        );

        if (dbResult.rows.length > 0) {
          successCount++;
        } else {
          errors.push({
            row,
            reason: "Student ID already exists",
          });
        }
      } catch (err) {
        console.error("Error processing voter:", err);

        errors.push({
          row,
          reason: err.message,
        });
      }
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs
        (action, actor_id, actor_role, details, organization_id)
      VALUES
        ($1, $2, $3, $4, $5)
      `,
      [
        "BULK_VOTER_REGISTERED",
        adminId,
        req.user.role,
        JSON.stringify({
          total: results.length,
          success: successCount,
          failed: errors.length,
        }),
        organizationId,
      ],
    );

    return res.json({
      success: true,
      message: `Bulk registration completed. ${successCount} added, ${errors.length} failed.`,
      summary: {
        total: results.length,
        success: successCount,
        failed: errors.length,
        errors,
      },
    });
  } catch (error) {
    console.error("BULK REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Bulk registration failed",
    });
  }
};

const getCandidates = async (req, res) => {
  const organizationId = req.user.organization_id;

  try {
    const result = await pool.query(
      `
      SELECT id, name, position, bio, photo_url, yes_or_no
      FROM candidates 
      WHERE organization_id = $1
      ORDER BY position, name
    `,
      [organizationId],
    );

    res.json({ success: true, candidates: result.rows });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch candidates" });
  }
};

const addCandidate = async (req, res) => {
  let { name, position, bio, yes_or_no } = req.body;
  const adminId = req.user.id;
  const organizationId = req.user.organization_id;

  if (!name || !position) {
    return res.status(400).json({
      success: false,
      message: "Candidate name and position are required",
    });
  }

  // Normalize inputs
  name = toTitleCase(name.trim());
  position = position.trim().toUpperCase();
  bio = bio ? bio.trim() : null;
  yes_or_no = yes_or_no ? yes_or_no.trim().toUpperCase() : null;

  try {
    let photoUrl = null;
    if (req.file) {
      photoUrl = await uploadFile(req.file);
    }
    const result = await pool.query(
      `
      INSERT INTO candidates (name, position, bio, photo_url, yes_or_no, organization_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, position, bio, photo_url, yes_or_no 
    `,
      [name, position, bio, photoUrl, yes_or_no, organizationId],
    );

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details, organization_id)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        "CANDIDATE_ADDED",
        adminId,
        req.user.role,
        { name, position, yes_or_no: yes_or_no },
        organizationId,
      ],
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
// Update Candidate (Scoped)
const updateCandidate = async (req, res) => {
  const { id } = req.params;
  let { name, position, bio, yes_or_no } = req.body;
  const adminId = req.user.id;
  const organizationId = req.user.organization_id;

  if (!name || !position) {
    return res.status(400).json({
      success: false,
      message: "Candidate name and position are required",
    });
  }

  // Check votes (scoped)
  const voteCheck = await pool.query(
    "SELECT COUNT(*) as vote_count FROM votes WHERE candidate_id = $1 AND organization_id = $2",
    [id, organizationId],
  );

  if (parseInt(voteCheck.rows[0].vote_count) > 0) {
    return res.status(400).json({
      success: false,
      message: "Cannot edit candidate because votes have already been cast.",
    });
  }

  // Normalize
  name = toTitleCase(name.trim());
  position = position.trim().toUpperCase();
  bio = bio ? bio.trim() : null;
  const yesOrNoValue = yes_or_no ? yes_or_no.trim().toUpperCase() : null;

  try {
    const result = await pool.query(
      `
      UPDATE candidates 
      SET name = $1, 
          position = $2, 
          bio = $3, 
          yes_or_no = $4
      WHERE id = $5 AND organization_id = $6
      RETURNING id, name, position, bio, photo_url, yes_or_no
    `,
      [name, position, bio, yesOrNoValue, id, organizationId],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details, organization_id)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        "CANDIDATE_UPDATED",
        adminId,
        req.user.role,
        { candidate_id: id, name, position, yes_or_no: yesOrNoValue },
        organizationId,
      ],
    );

    res.json({
      success: true,
      message: "Candidate updated successfully",
      candidate: result.rows[0],
    });
  } catch (error) {
    console.error("Update candidate error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update candidate" });
  }
};

// Delete Candidate (Scoped)
const deleteCandidate = async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const organizationId = req.user.organization_id;

  try {
    // Check if candidate has any votes (scoped)
    const voteCheck = await pool.query(
      "SELECT COUNT(*) as vote_count FROM votes WHERE candidate_id = $1 AND organization_id = $2",
      [id, organizationId],
    );

    if (parseInt(voteCheck.rows[0].vote_count) > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete candidate because votes have already been cast for them.",
      });
    }

    const result = await pool.query(
      "DELETE FROM candidates WHERE id = $1 AND organization_id = $2 RETURNING name",
      [id, organizationId],
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Candidate not found" });
    }

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details, organization_id)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        "CANDIDATE_DELETED",
        adminId,
        req.user.role,
        { candidate_id: id, name: result.rows[0].name },
        organizationId,
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

// Generate Voter Token (Scoped)
const generateVoterToken = async (req, res) => {
  const { student_id } = req.body;
  const actorId = req.user.id;
  const actorRole = req.user.role;
  const organizationId = req.user.organization_id;

  if (!student_id) {
    return res.status(400).json({
      success: false,
      message: "Student ID is required",
    });
  }

  try {
    // Check election active
    const electionCheck = await pool.query(
      "SELECT is_active FROM election_settings WHERE organization_id = $1",
      [organizationId],
    );

    if (!electionCheck.rows[0]?.is_active) {
      return res.status(400).json({
        success: false,
        message: "Election is currently closed",
      });
    }

    // Check voter
    const voterResult = await pool.query(
      `SELECT id, full_name, has_voted 
       FROM voters 
       WHERE student_id = $1 AND organization_id = $2`,
      [student_id, organizationId],
    );

    if (voterResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Voter not found",
      });
    }

    const voter = voterResult.rows[0];

    if (voter.has_voted) {
      return res.status(400).json({
        success: false,
        message: "This student has already voted",
      });
    }

    // Generate 6-Character Token
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const randomBytes = crypto.randomBytes(6);
    let tokenValue = "";

    for (let i = 0; i < 6; i++) {
      tokenValue += chars.charAt(randomBytes[i] % chars.length);
    }

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Save token
    const tokenInsert = await pool.query(
      `
      INSERT INTO tokens (voter_id, token_value, generated_by, expires_at, organization_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, token_value, expires_at
    `,
      [voter.id, tokenValue, actorId, expiresAt, organizationId],
    );

    // Audit log
    await pool.query(
      `
      INSERT INTO audit_logs (action, actor_id, actor_role, details, organization_id)
      VALUES ($1, $2, $3, $4, $5)
    `,
      [
        "TOKEN_GENERATED",
        actorId,
        actorRole,
        {
          student_id,
          voter_name: voter.full_name,
          token_value: tokenValue,
        },
        organizationId,
      ],
    );

    res.json({
      success: true,
      message:
        "Token generated successfully. Please write it down and give to the student.",
      token: tokenValue,
      expires_in: 900,
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
  const organizationId = req.user.organization_id;
  try {
    const result = await pool.query(
      `
      SELECT id, student_id, full_name, department, has_voted, created_at 
      FROM voters 
      WHERE organization_id = $1
      ORDER BY created_at DESC
    `,
      [organizationId],
    );

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

const getResults = async (req, res) => {
  const organizationId = req.user.organization_id;
  try {
    const result = await pool.query(
      `
      SELECT 
        c.position,
        c.name as candidate_name,
        c.photo_url,
        c.yes_or_no,
        COUNT(v.id) as votes,
        ROUND(COUNT(v.id) * 100.0 / NULLIF((SELECT COUNT(*) FROM votes WHERE organization_id = $1), 0), 2) as percentage
      FROM candidates c
      LEFT JOIN votes v ON c.id = v.candidate_id
      WHERE c.organization_id = $1
      GROUP BY c.position, c.id, c.name, c.photo_url
      ORDER BY c.position, votes DESC
    `,
      [organizationId],
    );

    // Group by position
    const grouped = result.rows.reduce((acc, row) => {
      if (!acc[row.position]) {
        acc[row.position] = [];
      }
      acc[row.position].push({
        name: row.candidate_name,
        photo_url: row.photo_url,
        yes_or_no: row.yes_or_no,
        votes: parseInt(row.votes),
        percentage: parseFloat(row.percentage) || 0,
      });
      return acc;
    }, {});

    const totalVotes = await pool.query(
      "SELECT COUNT(*) as total FROM votes WHERE organization_id = $1",
      [organizationId],
    );

    res.json({
      success: true,
      total_votes: parseInt(totalVotes.rows[0].total),
      results: grouped,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch results" });
  }
};

// Public Election Info (for voter side)
const getPublicElectionInfo = async (req, res) => {
  const organizationId = req.user.organization_id; // or from request if public
  try {
    const result = await pool.query(
      `
      SELECT
        title,
        logo_url,
        academic_year,
        is_active
      FROM election_settings
      WHERE organization_id = $1
    `,
      [organizationId],
    );

    res.json({
      success: true,
      election: result.rows[0] || {},
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch election information",
    });
  }
};

const getElectionSettings = async (req, res) => {
  const organizationId = req.user.organization_id;
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
      WHERE organization_id = $1
      `,
      [organizationId],
    );

    if (result.rows.length === 0) {
      await pool.query(
        `
        INSERT INTO election_settings (organization_id)
        VALUES ($1)
        ON CONFLICT (organization_id) DO NOTHING
        `,
        [organizationId],
      );

      result = await pool.query(
        `
        SELECT *
        FROM election_settings
        WHERE organization_id = $1
        `,
        [organizationId],
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
  getResults,
  bulkRegisterVoters,
  getPublicElectionInfo,
  getElectionSettings,
};
