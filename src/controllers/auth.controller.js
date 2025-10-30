const User = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "set-a-secure-jwt-secret";
const DEFAULT_OTP_LENGTH = parseInt(process.env.PHONE_OTP_LENGTH || "6", 10);
const DEFAULT_EXPIRY_MINUTES = parseInt(
  process.env.PHONE_OTP_EXPIRY_MINUTES || "10",
  10
);
const MAX_OTP_ATTEMPTS = parseInt(
  process.env.PHONE_OTP_MAX_ATTEMPTS || "5",
  10
);
const OTP_SALT_ROUNDS = parseInt(
  process.env.PHONE_OTP_SALT_ROUNDS || process.env.BCRYPT_SALT_ROUNDS || "10",
  10
);

function getExpiryDate(minutes = DEFAULT_EXPIRY_MINUTES) {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
}
const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone is required",
      });
    }
    let user = await User.findOne({ phone }).select("+phoneOtp.codeHash");
    if (!user) {
      user = new User({
        phone,
      });
    }
    const otp = "1234";
    const expiresAt = getExpiryDate();
    const hashedOtp = await bcrypt.hash(otp, OTP_SALT_ROUNDS);
    user.phoneOtp = {
      codeHash: hashedOtp,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    };

    await user.save();
    return res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        phone: user.phone,
        otp,
        expiresAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const verifyOtp = async (req, res) => {
  const { phone, otpCode } = req.body;
  if (!phone) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Phone number is required to verify OTP",
      });
  }

  const user = await User.findOne({ phone }).select("+phoneOtp.codeHash");
  if (!user) {
    return null;
  }

  if (!user.phoneOtp || !user.phoneOtp.codeHash) {
    return res
      .status(400)
      .json({
        success: false,
        message: "No OTP is pending verification for this user",
      });
  }

  if (user.expiresAt < new Date()) {
    return res
      .status(400)
      .json({
        success: false,
        message: "OTP has expired. Please request a new OTP",
      });
  }

  if (user.phoneOtp.attempts >= MAX_OTP_ATTEMPTS) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Maximum OTP attempts exceeded. Please request a new OTP",
      });
  }

  const normalizedOtp = String(otpCode || "").trim();
  if (!normalizedOtp) {
    return res.status(400).json({ success: false, message: "OTP is required" });
  }

  if (!user.phoneOtp.codeHash) {
    return res
      .status(400)
      .json({
        success: false,
        message: "No OTP hash found. Please request a new OTP",
      });
  }

  const result = await bcrypt.compare(normalizedOtp, user.phoneOtp.codeHash);
  if (!result) {
    user.phoneOtp.attempts = user.phoneOtp.attempts + 1;
    await user.save();
    return res
      .status(400)
      .json({ success: false, message: "Invalid OTP. Please try again" });
  }

  user.isVerified = true;
  user.phoneOtp = undefined;
  await user.save();
  const tokenPayload = {
    userId: user.id,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET);

  return res.status(200).json({
    success: true,
    data: {
      isProfileCompleted: user.isProfileCompleted,
      userId: user.id,
      phone: user.phone,
      token,
    },
  });
};
module.exports = {
  sendOtp,
  verifyOtp,
};
