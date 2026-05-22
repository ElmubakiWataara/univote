// backend/src/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const {
  adminLogin,
  verifyVoterToken,
} = require("../controllers/authController");

router.post("/admin-login", adminLogin);
router.post("/verify-token", verifyVoterToken);

module.exports = router;
