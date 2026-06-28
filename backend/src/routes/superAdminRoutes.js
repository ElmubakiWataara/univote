// backend/src/routes/superAdminRoutes.js
const express = require("express");
const router = express.Router();
const uploadElectionLogo = require("../middleware/uploadElectionLogo");

const { authenticate, authorizeRole } = require("../middleware/auth");
const {
  getAuditLogs,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  createAdmin,
  getElectionSettings,
  updateElectionConfig,
  toggleElection,
} = require("../controllers/superAdminController");

// Only Super Admin can access these routes
router.use(authenticate);
router.use(authorizeRole(["superadmin"]));
router.get("/audit-logs", getAuditLogs);
router.get("/admins", getAllAdmins);
router.post("/create-admin", createAdmin);
router.put("/admins/:id", updateAdmin);
router.delete("/admins/:id", deleteAdmin);

router.post("/toggle-election", toggleElection);
router.get("/election-settings", getElectionSettings);
router.post(
  "/update-election-config",
  uploadElectionLogo.single("logo"),
  updateElectionConfig,
);
module.exports = router;
