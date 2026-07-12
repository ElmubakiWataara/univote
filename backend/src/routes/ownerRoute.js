const express = require("express");
const router = express.Router();
const { authenticate, authorizeRole } = require("../middleware/auth");
const { ownerLogin } = require("../controllers/ownerController");
const { registerOrganization } = require("../controllers/ownerController");
const { getOrganizations } = require("../controllers/ownerController");

// Only Owners can register organizations
router.post(
  "/organizations",
  authenticate,
  authorizeRole(["owner"]),
  registerOrganization,
);

router.post("/login", ownerLogin);
router.post("/register-organization", registerOrganization); // Public for now or protected later
router.get("/organizations", getOrganizations);

module.exports = router;
