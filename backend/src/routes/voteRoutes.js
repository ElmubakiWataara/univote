// backend/src/routes/voteRoutes.js
const express = require("express");
const router = express.Router();

const { authenticate, authorizeRole } = require("../middleware/auth");
const { castVote, getCandidates } = require("../controllers/voteController");

// Only voters can access these routes
router.use(authenticate);
router.use(authorizeRole(["voter"]));

router.get("/candidates", getCandidates);
router.post("/vote", castVote);

module.exports = router;
