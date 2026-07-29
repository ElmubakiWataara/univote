const express = require("express");
const router = express.Router();
const { authenticate, authorizeRole } = require("../middleware/auth");
const { ownerLogin } = require("../controllers/ownerController");
const { registerOrganization } = require("../controllers/ownerController");
const { getOrganizations } = require("../controllers/ownerController");
const { updateOrganization } = require("../controllers/ownerController");
const { deleteOrganization } = require("../controllers/ownerController");
const { getPlatformStats } = require("../controllers/ownerController");
const { resetOrganizationElection } = require("../controllers/ownerController");

// Only Owners can register organizations
router.post(
  "/organizations",
  authenticate,
  authorizeRole(["owner"]),
  registerOrganization,
);
router.get(
  "/organizations",
  authenticate,
  authorizeRole(["owner"]),
  getOrganizations,
);

router.post("/login", ownerLogin);
router.post("/register-organization", registerOrganization); // Public for now or protected later

router.put(
  "/organizations/:id",
  authenticate,
  authorizeRole(["owner"]),
  updateOrganization,
);
router.delete(
  "/organizations/:id",
  authenticate,
  authorizeRole(["owner"]),
  deleteOrganization,
);

router.post(
  "/organizations/:id/reset",
  authenticate,
  authorizeRole(["owner"]),
  resetOrganizationElection,
);

router.get("/stats", authenticate, authorizeRole(["owner"]), getPlatformStats);

module.exports = router;
