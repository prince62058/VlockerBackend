const express = require("express");
const {
  createSupportInfo,
  updateSupportInfo,
  getSupportInfo,
} = require("../controllers/Company.controller.js");

const router = express.Router();

router.post("/", createSupportInfo);
router.put("/", updateSupportInfo);
router.get("/", getSupportInfo);

module.exports = router;
