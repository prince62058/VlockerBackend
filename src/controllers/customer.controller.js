const Customer = require("../models/Customer.model");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || "set-a-secure-jwt-secret";
const DEFAULT_OTP_LENGTH = parseInt(process.env.PHONE_OTP_LENGTH || "6", 10);
const DEFAULT_EXPIRY_MINUTES = parseInt(process.env.PHONE_OTP_EXPIRY_MINUTES || "10", 10);
const MAX_OTP_ATTEMPTS = parseInt(process.env.PHONE_OTP_MAX_ATTEMPTS || "5", 10);
const OTP_SALT_ROUNDS = parseInt(
  process.env.PHONE_OTP_SALT_ROUNDS || process.env.BCRYPT_SALT_ROUNDS || "10",
  10
);


function getExpiryDate(minutes = DEFAULT_EXPIRY_MINUTES) {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + minutes);
  return expiry;
}
const sendCustomerOtp = async (req, res) => {
  const { customerName, customerMobileNumber, address } = req.body;

  if (!customerName || !customerMobileNumber || !address) {
    return res.status(400).json({
      success: false,
      message: "Name, Mobile Number, and Address are required.",
    });
  }

  try {
    const existingVerifiedCustomer = await Customer.findOne({
      customerMobileNumber,
      createdBy: req.userId,
      isVerified: true,
    });
    if (existingVerifiedCustomer) {
      return res.status(400).json({
        success: false,
        message: "A verified customer with this mobile number already exists.",
      });
    }

    const otp =
      "123456" || Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = getExpiryDate();
    const hashedOtp = await bcrypt.hash(otp, OTP_SALT_ROUNDS);
  const   phoneOtp = {
      codeHash: hashedOtp,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    };
    await Customer.findOneAndUpdate(
      { customerMobileNumber, createdBy: req.userId },
      {
        customerName,
        address,
        createdBy: req.userId,
        phoneOtp,
        expiresAt,
        isVerified: false,
      },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      otp: "123456",
      message: "OTP sent to customer successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error sending OTP",
      error: error.message,
    });
  }
};
const verifyOtpAndCreateCustomer = async (req, res) => {
  const { customerMobileNumber, otp } = req.body;

  if (!customerMobileNumber || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Mobile Number and OTP are required." });
  }

  try {
    const customer = await Customer.findOne({
      customerMobileNumber,
      createdBy: req.userId,
    }).select("+phoneOtp.codeHash");
 console.log(customer);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found. Please send OTP first.",
      });
    }
    if (customer.isVerified) {
      return res
        .status(400)
        .json({ success: false, message: "Customer is already verified." });
    }
    
    const normalizedOtp = String(otp || "").trim();
    if (!normalizedOtp) {
      return res.status(400).json({ success: false, message: "OTP is required" });
    }
    if (!customer.phoneOtp.codeHash) {
      return res.status(400).json({ success: false, message: "No OTP hash found. Please request a new OTP" });
    }
       if (customer.phoneOtp.attempts >= MAX_OTP_ATTEMPTS) {
        return res.status(400).json({ success: false, message: "Maximum OTP attempts exceeded. Please request a new OTP" });
    }

    const result = await bcrypt.compare(normalizedOtp, customer.phoneOtp.codeHash)
    if (!result) {
      customer.phoneOtp.attempts = customer.phoneOtp.attempts + 1;
      await customer.save();
      return res.status(400).json({ success: false, message: "Invalid OTP. Please try again" });

    }


    customer.isVerified = true;
    customer.phoneOtp = undefined;
    await customer.save();

    res.status(201).json({
      success: true,
      message: "Customer verified and created successfully",
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error verifying OTP",
      error: error.message,
    });
  }
};

const getAllCustomers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { createdBy: req.userId, isVerified: true };

    const customers = await Customer.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalCustomers = await Customer.countDocuments(filter);
    const totalPages = Math.ceil(totalCustomers / limit);

    const pagination = {
      totalCustomers: totalCustomers,
      totalPages: totalPages,
      currentPage: page,
      limit: limit,
    };

    res.status(200).json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers,
      pagination: pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving customers",
      error: error.message,
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      createdBy: req.userId,
    });
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Customer found", data: customer });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error finding customer",
      error: error.message,
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.userId },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found or you are not authorized",
      });
    }
    res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating customer",
      error: error.message,
    });
  }
};
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.userId,
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found or you are not authorized",
      });
    }
    res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting customer",
      error: error.message,
    });
  }
};

const completeAadhaarKYC = async (req, res) => {
  try {
    const customerId = req.params.id;
    const { aadhaarNumber } = req.body;
    const aadhaarFront = req.files["aadhaarFront"]
      ? req.files["aadhaarFront"][0].location
      : null;
    const aadhaarBack = req.files["aadhaarBack"]
      ? req.files["aadhaarBack"][0].location
      : null;

    if (!aadhaarNumber || !aadhaarFront || !aadhaarBack) {
      return res
        .status(400)
        .json({ success: false, message: "All Aadhaar fields are required" });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
        "kyc.aadhaar.number": aadhaarNumber,
        "kyc.aadhaar.frontPhoto": aadhaarFront,
        "kyc.aadhaar.backPhoto": aadhaarBack,
      },
      { new: true }
    );

    console.log(updatedCustomer);
    res.status(200).json({ success: true, data: updatedCustomer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const completePanKYC = async (req, res) => {
  try {
    const customerId = req.params.id;
    const { panNumber } = req.body;
    const panPhoto = req.file ? req.file.location : null;

    if (!panNumber || !panPhoto) {
      return res
        .status(400)
        .json({ success: false, message: "PAN number and photo are required" });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      {
        "kyc.pan.number": panNumber,
        "kyc.pan.photo": panPhoto,
      },
      { new: true }
    );

    res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const addBankPassbook = async (req, res) => {
  try {
    const customerId = req.params.id;
    const bankPassbookPhoto = req.file ? req.file.location : null;

    if (!bankPassbookPhoto) {
      return res
        .status(400)
        .json({ success: false, message: "Bank passbook photo is required" });
    }

    const updatedCustomer = await Customer.findByIdAndUpdate(
      customerId,
      { "kyc.bankPassbook.photo": bankPassbookPhoto },
      { new: true }
    );

    res.status(200).json(updatedCustomer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  sendCustomerOtp,
  verifyOtpAndCreateCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  completeAadhaarKYC,
  completePanKYC,
  addBankPassbook,
};
