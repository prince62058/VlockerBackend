const express = require("express");
const { sendOtp, verifyOtp } = require("../controllers/auth.controller");
const {
  sendOtpSchema,
  verifyOtpSchema,
} = require("../validations/authValidation");
const router = express.Router();
const validateRequest = require("../middleware/validateRequest");

router.post("/send-otp", validateRequest(sendOtpSchema), sendOtp);
router.post("/verify-otp", validateRequest(verifyOtpSchema), verifyOtp);

module.exports = router;
