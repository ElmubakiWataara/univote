const express = require("express");
const router = express.Router();
const { registerOrganization } = require("../controllers/ownerController");
const { authenticate, authorizeRole } = require("../middleware/auth");
const { ownerLogin } = require("../controllers/ownerController");

router.post("/register", registerOrganization); // Public for now or protected later
router.post("/login", ownerLogin);
// Only Owners can register organizations
router.post(
  "/organizations",
  authenticate,
  authorizeRole(["owner"]),
  registerOrganization,
);

module.exports = router;
