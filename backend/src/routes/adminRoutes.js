const express = require("express");
const router = express.Router();
const multer = require("multer");
const { upload, csvUpload } = require("../middleware/uploadElectionLogo");

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
  getResults,
  bulkRegisterVoters,
  getElectionSettings,
} = require("../controllers/adminController");

// Protect all admin routes
router.use(authenticate);
router.use(authorizeRole(["admin", "superadmin"]));

router.post("/register-voter", registerVoter);
router.post("/generate-token", generateVoterToken);
router.get("/voters", getAllVoters);
router.get("/candidates", getCandidates);
router.post("/candidates", upload.single("photo"), addCandidate); // ← Updated with upload
router.put("/voters/:id", updateVoter);
router.delete("/voters/:id", deleteVoter);
router.put("/candidates/:id", updateCandidate);
router.delete("/candidates/:id", deleteCandidate);
router.get("/results", getResults);
// router.post("/voters/bulk", upload.single("file"), bulkRegisterVoters);
router.post(
  "/voters/bulk",
  authenticate,
  authorizeRole(["admin", "superadmin"]),
  csvUpload.single("file"),
  bulkRegisterVoters,
);
router.get("/election-settings", getElectionSettings);

module.exports = router;
