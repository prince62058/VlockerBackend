const express = require("express");
const {
  createSupportInfo,
  updateSupportInfo,
  getSupportInfo,
} = require("../controllers/Company.controller.js");

const router = express.Router();

router.post("/create-support", createSupportInfo);
router.put("/update-support/:id", updateSupportInfo);
router.get("/get-support", getSupportInfo);

module.exports = router;
