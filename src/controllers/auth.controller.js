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
function generateOTP(length = CONFIG.otpLength) {
  const digits = "0123456789";
  let otp = "";
  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }

  return otp;
}
const registerAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingAdmin = await User.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newAdmin = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
    });
    const tokenPayload = {
      userId: newAdmin._id,
      role: newAdmin.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET);

    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      data: {
        id: newAdmin._id,

        email: newAdmin.email,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // if (!email || !password) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'Please provide email and password'
    //   });
    // }

    const admin = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (admin.isDisabled === true) {
      return res.status(403).json({
        success: false,
        message: "Account has been deactivated",
      });
    }

    const tokenPayload = {
      userId: admin._id,
      role: admin.role,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        id: admin._id,
        name: admin.name,
        email: admin.email,

        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { phone, type } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone is required",
      });
    }
    let user = await User.findOne({ phone }).select("+phoneOtp.codeHash");

    // [MODIFIED] Added check for 'login' type. If user doesn't exist during login, return 404.
    if (!user) {
      if (type === "login") {
        return res.status(404).json({
          success: false,
          message: "Number is not registered",
        });
      }
      user = new User({
        phone,
      });
    }

    const now = new Date();
    if (user.phoneOtp?.lastSentAt) {
      const timeSinceLastOtp = now - new Date(user.phoneOtp.lastSentAt);
      const cooldownPeriod = 60 * 1000;

      if (timeSinceLastOtp < cooldownPeriod) {
        const waitTime = Math.ceil((cooldownPeriod - timeSinceLastOtp) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting another OTP`,
        });
      }
    }
    const dailyLimit = 5;
    if (user.phoneOtp?.attempts >= dailyLimit) {
      const lastAttemptDate = new Date(user.phoneOtp.lastSentAt);
      const hoursSinceLastAttempt = (now - lastAttemptDate) / (1000 * 60 * 60);

      if (hoursSinceLastAttempt < 24) {
        return res.status(429).json({
          success: false,
          message: "Daily OTP limit reached. Please try again after 24 hours",
        });
      } else {
        user.phoneOtp.attempts = 0;
      }
    }
    // const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const otp = "1234";
    const otpSent = await sendOtpViaMSG91(phone, otp);
    if (!otpSent) {
      return res.status(500).json({
        success: false,
        message: "Failed to send OTP. Please try again",
      });
    }
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

const https = require("https");

const sendOtpViaMSG91 = async (mobile, otp) => {
  console.log(mobile, otp);
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      hostname: "api.msg91.com",
      path: "/api/v5/flow/",
      headers: {
        authkey: process.env.AUTH_KEY,
        "content-type": "application/json",
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];

      res.on("data", (chunk) => chunks.push(chunk));

      res.on("end", () => {
        const body = Buffer.concat(chunks).toString();
        console.log("OTP Sent:", body);
        resolve(body);
      });
    });

    req.on("error", (err) => {
      console.error("Error sending OTP:", err);
      reject(err);
    });

    const payload = {
      flow_id: "63614b3dabf10640e61fa856",
      sender: "DSMONL",
      mobiles: `91${mobile}`,
      otp: otp,
    };

    req.write(JSON.stringify(payload));
    req.end();
  });
};

const verifyOtp = async (req, res) => {
  const { phone, otpCode } = req.body;
  if (!phone) {
    return res.status(400).json({
      success: false,
      message: "Phone number is required to verify OTP",
    });
  }

  const user = await User.findOne({ phone }).select("+phoneOtp.codeHash");
  if (!user) {
    return null;
  }

  if (!user.phoneOtp || !user.phoneOtp.codeHash) {
    return res.status(400).json({
      success: false,
      message: "No OTP is pending verification for this user",
    });
  }

  if (user.expiresAt < new Date()) {
    return res.status(400).json({
      success: false,
      message: "OTP has expired. Please request a new OTP",
    });
  }

  if (user.phoneOtp.attempts >= MAX_OTP_ATTEMPTS) {
    return res.status(400).json({
      success: false,
      message: "Maximum OTP attempts exceeded. Please request a new OTP",
    });
  }

  const normalizedOtp = String(otpCode || "").trim();
  if (!normalizedOtp) {
    return res.status(400).json({ success: false, message: "OTP is required" });
  }

  if (!user.phoneOtp.codeHash) {
    return res.status(400).json({
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
  loginAdmin,
  sendOtp,
  verifyOtp,
  registerAdmin,
  loginAdmin,
};
