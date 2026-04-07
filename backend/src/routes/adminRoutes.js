// backend/src/routes/adminRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");

const { authenticate, authorizeRole } = require("../middleware/auth");
const {
  generateVoterToken,
  getAllVoters,
  registerVoter,
  getCandidates,
  addCandidate,
  updateVoter,
  deleteVoter,
  updateCandidate,
  deleteCandidate,
} = require("../controllers/adminController");

// Setup multer for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Protect all admin routes
router.use(authenticate);
router.use(authorizeRole(["admin", "superadmin"]));

router.post("/register-voter", registerVoter);
router.post("/generate-token", generateVoterToken);
router.get("/voters", getAllVoters);
router.get("/candidates", getCandidates);
// router.post("/candidates", addCandidate);
router.post("/candidates", upload.single("photo"), addCandidate); // ← Updated with upload
router.put("/voters/:id", updateVoter);
router.delete("/voters/:id", deleteVoter);
router.put("/candidates/:id", updateCandidate);
router.delete("/candidates/:id", deleteCandidate);

module.exports = router;
