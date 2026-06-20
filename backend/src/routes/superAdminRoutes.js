const express = require("express");
const router = express.Router();

const { authenticate, authorizeRole } = require("../middleware/auth");
const {
  toggleElection,
  getAuditLogs,
  getAllAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} = require("../controllers/superAdminController");

// Only Super Admin can access these routes
router.use(authenticate);
router.use(authorizeRole(["superadmin"]));

router.post("/toggle-election", toggleElection);
router.get("/audit-logs", getAuditLogs);
router.get("/admins", getAllAdmins);
router.post("/create-admin", createAdmin);
router.put("/admins/:id", updateAdmin);
router.delete("/admins/:id", deleteAdmin);

module.exports = router;
