const Loan = require("../models/CustomerLoan.model");
const Customer = require("../models/Customer.model");
const User = require("../models/UserModel");
const mongoose = require("mongoose");

const generateInstallments = ({
  numberOfEMIs,
  emiAmount,
  firstEmiDate,
  frequency,
}) => {
  const installments = [];
  let currentDate = new Date(firstEmiDate);

  for (let i = 1; i <= numberOfEMIs; i++) {
    installments.push({
      installmentNumber: i,
      dueDate: new Date(currentDate),
      amount: emiAmount,
      status: emiAmount == 0 ? "PAID" : "PENDING",
      paidAmount: 0,
      paidDate: emiAmount == 0 ? new Date() : null,
      paymentMethod: null,
      lateFee: 0,
      remarks: null,
    });

    if (frequency === "monthly" && i < numberOfEMIs) {
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else if (frequency === "weekly" && i < numberOfEMIs) {
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (frequency === "daily" && i < numberOfEMIs) {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return [installments, currentDate];
};
const calculateEMI = (principal, annualRate, numberOfEMIs) => {
  const monthlyRate = annualRate / 12 / 100;

  if (monthlyRate === 0) {
    return Math.round(principal / numberOfEMIs);
  }

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfEMIs)) /
    (Math.pow(1 + monthlyRate, numberOfEMIs) - 1);

  return Math.round(emi);
};

const createCustomerloan = async (req, res) => {
  const { customerId } = req.params;
  try {
    const customer = await Customer.findOne({
      _id: customerId,
      createdBy: req.userId,
    });

    const keysExist = await User.findById(req.userId);
    const loanExist = await Loan.findOne({
      imeiNumber1: req.body.imeiNumber1,
    });
    if (loanExist) {
      return res.status(400).json({
        success: false,
        message: "imei number already exist",
      });
    }

    if (keysExist?.keys <= 0) {
      return res.status(400).json({
        success: false,
        message: "request keys to create loan",
      });
    }
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found or you are not authorized",
      });
    }
    const downPayment = req.body?.downPayment || 0;
    const mobilePrice = req.body?.mobilePrice || 0;
    const processingFees = req.body?.processingFees || 0;
    const interestRate = req.body?.interestRate || 0;
    const numberOfEMIs = req.body?.numberOfEMIs || 1;
    const financer = req.body?.financer || "admin";
    const paymentOptions = req.body?.paymentOptions || "upi";

    let firstEmiDate = new Date(req.body?.firstEmiDate);
    if (isNaN(firstEmiDate)) {
      firstEmiDate = new Date();
    }

    const loanAmount = req.body?.loanAmount;
    const amountLeft = loanAmount;
    let frequency = req.body?.frequency || "monthly";

    const emiAmount = calculateEMI(loanAmount, interestRate, numberOfEMIs);
    console.log(req.body, emiAmount);
    console.log(loanAmount, interestRate, numberOfEMIs, emiAmount);
    const [installments, emiEndDate] = generateInstallments({
      numberOfEMIs,
      emiAmount,
      firstEmiDate,
      frequency,
    });

    const loan = new Loan({
      ...req.body,
      installments,
      financer,
      paymentOptions,
      emiAmount,
      amountLeft: amountLeft,
      amountPaid: downPayment,
      emiStartDate: firstEmiDate,
      emiEndDate: emiEndDate,
      customerId: customerId,
      createdBy: req.userId,
    });
    await loan.save();
    res.status(201).json({
      success: true,
      message: "Customer Loan created successfully",
      data: loan,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A loan with this IMEI number already exists.",
        error: error.message,
      });
    }
    res.status(400).json({
      success: false,
      message: "Error creating customer Loan",
      error: error.message,
    });
  }
};

const getAllCustomersloan = async (req, res) => {
  try {
    console.log("Fetching loans for customerId:", req.params.customerId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {
      customerId: new mongoose.Types.ObjectId(req.params.customerId),
      // createdBy: new mongoose.Types.ObjectId(req.userId),
      ...(req.role !== "admin" && {
        createdBy: new mongoose.Types.ObjectId(req.userId),
      }),
    };

    // const loans2 = await Loan.find(filter)
    //   .skip(skip)
    //   .limit(limit)
    //   .sort({ createdAt: -1 }).populate("customerId");

    let sort = undefined;
    if (!sort) {
      sort = {
        createdAt: -1,
      };
    }

    const loans = await Loan.aggregate([
      { $match: filter },

      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customerId",
        },
      },
      { $unwind: "$customerId" },
      {
        $addFields: {
          installmentsPaid: {
            $size: {
              $filter: {
                input: { $ifNull: ["$installments", []] },
                as: "inst",
                cond: { $eq: ["$$inst.status", "PAID"] },
              },
            },
          },
        },
      },
      {
        $facet: {
          data: [{ $sort: sort }, { $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);
    const totalLoans = loans[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalLoans / limit);

    const pagination = {
      totalLoans,
      totalPages: totalPages,
      currentPage: page,
    };

    res.status(200).json({
      success: true,
      message: "Customers Loan retrieved successfully",
      data: loans[0]?.data,
      pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving customers Loan",
      error: error.message,
    });
  }
};
const getAllloans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const runningDevice = req.query.runningDevice || null;
    const newDevice = req.query.newDevice || null;
    const deactivateDevices = req.query?.deactivateDevices || null;
    const lockedDevices = req.query?.lockedDevices || null;
    const notActiveDevices = req.query?.notActiveDevices || null;
    const upcomingEmis = req.query?.upcomingEmis || null;
    const unlockDevices = req.query.unlockDevices || null;
    let sort = undefined;

    const filters = [];

    if (runningDevice) {
      filters.push({
        loanStatus: "APPROVED",
        firstEmiDate: { $lte: new Date() },
      });
    }
    if (newDevice) {
      filters.push({
        loanStatus: "APPROVED",
        firstEmiDate: { $gte: new Date() },
      });
    }
    if (deactivateDevices) {
      filters.push({
        loanStatus: "CLOSED",
      });
    }
    if (lockedDevices) {
      filters.push({
        deviceUnlockStatus: "LOCKED",
      });
    }
    if (unlockDevices) {
      filters.push({
        deviceUnlockStatus: "UNLOCKED",
        loanStatus: "APPROVED",
      });
    }
    if (notActiveDevices) {
      filters.push({
        loanStatus: "PENDING",
      });
    }
    if (upcomingEmis) {
      filters.push({
        loanStatus: "APPROVED",
        installments: {
          $elemMatch: {
            dueDate: { $gte: new Date() },
            status: "PENDING",
          },
        },
      });
      sort = {
        "installments.dueDate": 1,
      };
    }
    const finalFilter = {
      // createdBy: new mongoose.Types.ObjectId(req.userId),
      ...(req.role !== "admin" && {
        createdBy: new mongoose.Types.ObjectId(req.userId),
      }),
      ...(filters.length > 0 ? { $or: filters } : {}),
    };

    if (!sort) {
      sort = {
        createdAt: -1,
      };
    }

    const loans = await Loan.aggregate([
      { $match: finalFilter },

      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customerId",
        },
      },
      {
        $unwind: {
          path: "$customerId",
          preserveNullAndEmptyArrays: true,
        },
      },
      // Search Filter
      ...(req.query.search
        ? [
            {
              $match: {
                $or: [
                  {
                    "customerId.customerName": {
                      $regex: req.query.search,
                      $options: "i",
                    },
                  },
                  {
                    "customerId.customerMobileNumber": {
                      $regex: req.query.search,
                      $options: "i",
                    },
                  },
                  {
                    mobileBrand: { $regex: req.query.search, $options: "i" },
                  },
                  {
                    mobileModel: { $regex: req.query.search, $options: "i" },
                  },
                  {
                    imeiNumber1: { $regex: req.query.search, $options: "i" },
                  },
                ],
              },
            },
          ]
        : []),
      {
        $addFields: {
          installmentsPaid: {
            $size: {
              $filter: {
                input: { $ifNull: ["$installments", []] },
                as: "inst",
                cond: { $eq: ["$$inst.status", "PAID"] },
              },
            },
          },
          nextEmiDetails: {
            $arrayElemAt: [
              {
                $filter: {
                  input: { $ifNull: ["$installments", []] },
                  as: "inst",
                  cond: { $eq: ["$$inst.status", "PENDING"] },
                },
              },
              0,
            ],
          },
          totalDueAmount: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: { $ifNull: ["$installments", []] },
                    as: "inst",
                    cond: {
                      $and: [
                        { $eq: ["$$inst.status", "PENDING"] },
                        { $lte: ["$$inst.dueDate", new Date()] },
                      ],
                    },
                  },
                },
                as: "dueInst",
                in: "$$dueInst.amount",
              },
            },
          },
        },
      },
      {
        $facet: {
          data: [{ $sort: sort }, { $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);
    //  console.log(loans)

    // const totalLoans = await Loan.countDocuments();

    // const totalPages = Math.ceil(totalLoans / limit);
    const totalLoans = loans[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalLoans / limit);

    const pagination = {
      totalLoans: totalLoans,
      totalPages: totalPages,
      currentPage: page,
    };

    res.status(200).json({
      success: true,
      message: "Customers Loan retrieved successfully",
      data: loans[0]?.data,
      pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving customers Loan",
      error: error.message,
    });
  }
};

const getCustomerloanById = async (req, res) => {
  try {
    console.log("Fetching loan with ID:", req.params.loanId, req.userId);
    const query = { _id: req.params.loanId };
    if (req.role !== "admin") {
      query.createdBy = req.userId;
    }
    const loan = await Loan.findOne(query).populate("customerId");
    if (!loan) {
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    }
    res.status(200).json({ success: true, message: "Loan found", data: loan });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error finding customer Loan",
      error: error.message,
    });
  }
};

const updateCustomerloan = async (req, res) => {
  try {
    const query = { _id: req.params.loanId };
    if (req.role !== "admin") {
      query.createdBy = req.userId;
    }

    const loan = await Loan.findOneAndUpdate(
      query,
      { $set: req.body },
      { new: true, runValidators: true },
    );

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Customer loan not found or you are not authorized to update",
      });
    }
    res.status(200).json({
      success: true,
      message: "Customer loan updated successfully",
      data: loan,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating customer loan",
      error: error.message,
    });
  }
};

const deleteCustomerloan = async (req, res) => {
  try {
    const query = { _id: req.params.loanId };
    if (req.role !== "admin") {
      query.createdBy = req.userId;
    }

    const loan = await Loan.findOneAndDelete(query);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: "Customer loan not found or you are not authorized to delete",
      });
    }
    res
      .status(200)
      .json({ success: true, message: "Customer loan deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting customer loan",
      error: error.message,
    });
  }
};

const getDueInstallments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const userId = new mongoose.Types.ObjectId(req.userId);

    const dueInstallments = await Loan.aggregate([
      {
        $match: {
          createdBy: userId,
          installments: {
            $elemMatch: {
              dueDate: { $lte: new Date() },
              status: "PENDING",
            },
          },
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customerId",
        },
      },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);
    const totalLoans = dueInstallments[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalLoans / limit);

    const pagination = {
      totalLoans: totalLoans,
      totalPages: totalPages,
      currentPage: page,
    };

    res.status(200).json({
      success: true,
      message: "Due installments fetched successfully",
      data: dueInstallments[0].data,
      pagination: pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting customer loan",
      error: error.message,
    });
  }
};

const { sendNotificationCore } = require("../lib/notifications");

const lockDevice = async (req, res) => {
  try {
    const { loanId } = req.params;
    console.log("---------------- LOCK DEVICE REQUEST ----------------");
    console.log("Requested Loan ID:", loanId);

    const loan = await Loan.findById(loanId).populate("customerId");
    if (!loan) {
      console.log("Error: Loan not found");
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    }

    const customer = loan.customerId;
    if (!customer) {
      console.log("Error: Customer not found in loan doc");
      return res
        .status(404)
        .json({ success: false, message: "Customer not found for this loan" });
    }
    console.log(
      "Found Customer:",
      customer.customerName,
      "Mobile:",
      customer.customerMobileNumber,
    );

    // Normalize phone: remove all non-digits
    const searchPhone = customer.customerMobileNumber.replace(/\D/g, "");
    console.log("Searching for User with phone:", searchPhone);

    let user = await User.findOne({ phone: customer.customerMobileNumber });
    if (!user) {
      user = await User.findOne({ phone: searchPhone });
    }

    // Try to send FCM notification if User exists with token
    // But don't fail if User/token not found - status update is what matters
    if (user && user.pushNotificationToken) {
      console.log("Found User:", user._id, "Sending FCM notification...");
      try {
        await sendNotificationCore({
          userId: user._id,
          title: "Device Lock",
          body: "Your device is being locked due to overdue payment.",
          bodi: "Your device is being locked due to overdue payment.",
          data: { type: "LOCK" },
          silent: true,
          highPriority: true,
        });
        console.log("FCM notification sent successfully");
      } catch (firebaseError) {
        console.error("Firebase Send Error detected:", firebaseError);
        // Continue anyway - mobile app will poll status
      }
    } else {
      console.log(
        "User/Token not found. Skipping FCM notification. Mobile app will poll status.",
      );
    }

    // Always update lock status in database
    loan.deviceUnlockStatus = "LOCKED";
    await loan.save();

    console.log("Loan Status Updated to LOCKED");
    res
      .status(200)
      .json({ success: true, message: "Device locked successfully" });
  } catch (error) {
    console.error("Lock Device Error:", error);
    res.status(500).json({
      success: false,
      message: "Error locking device",
      error: error.message,
    });
  }
};

const unlockDevice = async (req, res) => {
  try {
    const { loanId } = req.params;
    console.log("---------------- UNLOCK DEVICE REQUEST ----------------");
    console.log("Requested Loan ID:", loanId);

    const loan = await Loan.findById(loanId).populate("customerId");
    if (!loan) {
      console.log("Error: Loan not found");
      return res
        .status(404)
        .json({ success: false, message: "Loan not found" });
    }

    const customer = loan.customerId;
    if (!customer) {
      console.log("Error: Customer not found in loan doc");
      return res
        .status(404)
        .json({ success: false, message: "Customer not found for this loan" });
    }
    console.log(
      "Found Customer:",
      customer.customerName,
      "Mobile:",
      customer.customerMobileNumber,
    );

    // Normalize phone: remove all non-digits
    const searchPhone = customer.customerMobileNumber.replace(/\D/g, "");
    console.log("Searching for User with phone:", searchPhone);

    let user = await User.findOne({ phone: customer.customerMobileNumber });
    if (!user) {
      user = await User.findOne({ phone: searchPhone });
    }

    // Try to send FCM notification if User exists with token
    // But don't fail if User/token not found - status update is what matters
    if (user && user.pushNotificationToken) {
      console.log("Found User:", user._id, "Sending FCM notification...");
      try {
        await sendNotificationCore({
          userId: user._id,
          title: "Device Unlocked",
          body: "Your device has been unlocked.",
          bodi: "Your device has been unlocked.",
          data: { type: "UNLOCK" },
          silent: true,
          highPriority: true,
        });
        console.log("FCM notification sent successfully");
      } catch (firebaseError) {
        console.error("Firebase Send Error detected in UNLOCK:", firebaseError);
        // Continue anyway - mobile app will poll status
      }
    } else {
      console.log(
        "User/Token not found. Skipping FCM notification. Mobile app will poll status.",
      );
    }

    // Always update unlock status in database
    loan.deviceUnlockStatus = "UNLOCKED";
    await loan.save();

    console.log("Loan Status Updated to UNLOCKED");
    res
      .status(200)
      .json({ success: true, message: "Device unlocked successfully" });
  } catch (error) {
    console.error("Unlock Device Error:", error);
    res.status(500).json({
      success: false,
      message: "Error unlocking device",
      error: error.message,
    });
  }
};

const getMobileDeviceStatus = async (req, res) => {
  try {
    // 1. Identify User from Token
    const userId = req.userId;
    console.log("Mobile Polling Status for User:", userId);

    // 2. Find User's Phone Number
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 3. Find Customer with this Phone Number
    // Note: The Loan is linked to a Customer, not directly to the User (in current schema)
    // We assume the Customer's mobile number matches the Registered User's phone.
    const customer = await Customer.findOne({
      customerMobileNumber: user.phone,
    });

    if (!customer) {
      // It's possible the Admin hasn't created a Customer record for this User yet
      console.log("No Customer found for mobile:", user.phone);
      return res.status(200).json({ success: true, data: null });
    }

    // 4. Find Active Loan for this Customer
    // Retrieve the latest loan
    const loans = await Loan.find({ customerId: customer._id }).sort({
      createdAt: -1,
    });

    if (!loans || loans.length === 0) {
      console.log("No loans found for customer:", customer._id);
      return res.status(200).json({ success: true, data: null });
    }

    const latestLoan = loans[0];
    console.log(
      "Found Loan:",
      latestLoan._id,
      "Status:",
      latestLoan.deviceUnlockStatus,
    );

    return res.status(200).json({
      success: true,
      data: latestLoan,
    });
  } catch (error) {
    console.error("Mobile Status Error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching device status",
      error: error.message,
    });
  }
};

module.exports = {
  createCustomerloan,
  getAllCustomersloan,
  getCustomerloanById,
  updateCustomerloan,
  deleteCustomerloan,
  getAllloans,
  getDueInstallments,
  lockDevice,
  unlockDevice,
  getMobileDeviceStatus,
};
