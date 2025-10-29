const Loan = require("../models/CustomerLoan.model");
const Customer = require("../models/Customer.model");

const createCustomerloan = async (req, res) => {
  const { customerId } = req.params;
  try {
    console.log("Creating loan for customerId:", customerId);
    const customer = await Customer.findOne({
      _id: customerId,
      createdBy: req.userId,
    });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found or you are not authorized",
      });
    }

    const loan = new Loan({
      ...req.body,
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
        message: "Error creating customer loan",
        error: "A loan with this IMEI number already exists.",
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
      customerId: req.params.customerId,
      createdBy: req.userId,
    };

    const loans = await Loan.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalLoans = await Loan.countDocuments(filter);

    const totalPages = Math.ceil(totalLoans / limit);
    const pagination = {
      totalLoans,
      totalPages: totalPages,
      currentPage: page,
    };

    res.status(200).json({
      success: true,
      message: "Customers Loan retrieved successfully",
      data: loans,
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

    const filter = {
      createdBy: req.userId,
    };

    const loans = await Loan.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalLoans = await Loan.countDocuments(filter);

    const totalPages = Math.ceil(totalLoans / limit);
    const pagination = {
      totalLoans,
      totalPages: totalPages,
      currentPage: page,
    };

    res.status(200).json({
      success: true,
      message: "Customers Loan retrieved successfully",
      data: loans,
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
    const loan = await Loan.findOne({
      _id: req.params.loanId,
      createdBy: req.userId,
    });
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
    const loan = await Loan.findOneAndUpdate(
      {
        _id: req.params.loanId,
        createdBy: req.userId,
      },
      { $set: req.body },
      { new: true, runValidators: true }
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
    const loan = await Loan.findOneAndDelete({
      _id: req.params.loanId,

      createdBy: req.userId,
    });

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
    res
      .status(500)
      .json({
        success: false,
        message: "Error deleting customer loan",
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
};
