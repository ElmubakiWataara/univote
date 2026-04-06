// backend/src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate, authorizeRole } = require("../middleware/auth");
const {
  generateVoterToken,
  getAllVoters,
  registerVoter,
  getCandidates,
  addCandidate,
  updateVoter,
  deleteVoter,
} = require("../controllers/adminController");

// Protect all admin routes
router.use(authenticate);
router.use(authorizeRole(["admin", "superadmin"]));

router.post("/register-voter", registerVoter);
router.post("/generate-token", generateVoterToken);
router.get("/voters", getAllVoters);
router.get("/candidates", getCandidates);
router.post("/candidates", addCandidate);
router.put("/voters/:id", updateVoter);
router.delete("/voters/:id", deleteVoter);

module.exports = router;
