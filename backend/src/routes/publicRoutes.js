const express = require("express");
const router = express.Router();

const { getPublicElectionInfo } = require("../controllers/publicController");

router.get("/election-info", getPublicElectionInfo);

module.exports = router;
