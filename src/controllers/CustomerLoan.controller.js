const Loan = require("../models/CustomerLoan.model");
const Customer = require("../models/Customer.model");
const { default: mongoose } = require("mongoose");

const generateInstallments = ({ numberOfEMIs, emiAmount, firstEmiDate, frequency }) => {
  const installments = [];
  let currentDate = new Date(firstEmiDate);

  for (let i = 1; i <= numberOfEMIs; i++) {
    installments.push({
      installmentNumber: i,
      dueDate: new Date(currentDate),
      amount: emiAmount,
      status: emiAmount==0?"PAID":"PENDING",
      paidAmount: 0,
      paidDate: emiAmount==0?new Date():null,
      paymentMethod: null,
      lateFee: 0,
      remarks: null
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

  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfEMIs)) /
              (Math.pow(1 + monthlyRate, numberOfEMIs) - 1);

  return Math.round(emi);
};


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
    console.log(req.body)
    const downPayment = req.body?.downPayment || 0;
    console.log(downPayment)
    const mobilePrice = req.body?.mobilePrice || 0;
    const processingFees = req.body?.processingFees || 0;
    const interestRate = req.body?.interestRate || 0;
    const numberOfEMIs = req.body?.numberOfEMIs || 1;
    const financer=req.body?.financer || 'admin'
    const paymentOptions=req.body?.paymentOptions || "upi"
    
    let firstEmiDate = new Date(req.body?.firstEmiDate) 
    if(isNaN(firstEmiDate)){
      firstEmiDate=new Date()
    }
 
    const loanAmount = req.body?.loanAmount;
    console.log(loanAmount)
    console.log("this runs",req.body.frequency.length)
    let frequency = req.body?.frequency || 'monthly'
    console.log(frequency.length)
    if(frequency.length==0){
      frequency='monthly'
      console.log("this run2")

    }
    const emiAmount = calculateEMI(loanAmount, interestRate, numberOfEMIs)
    console.log(loanAmount,interestRate,numberOfEMIs , emiAmount)
    const [installments, emiEndDate] = generateInstallments({
      numberOfEMIs,
      emiAmount,
      firstEmiDate,
      frequency
    });

    const loan = new Loan({
      ...req.body,
      installments,
      financer,
      paymentOptions,
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
    const runningDevice = req.query.runningDevice || null;
    const newDevice = req.query.newDevice || null;
    const deactivateDevices = req.query.deactivateDevices || null
    const lockedDevices = req.query.lockedDevices || null
    const notActiveDevices = req.query.notActiveDevices || null
    const upcomingEmis = req.query.upcomingEmis || null
    const unlockDevices = req.query.unlockDevices || null
    let sort = undefined
    const filter = {
      createdBy: new mongoose.Types.ObjectId(req.userId),
    };
    const filters = []

    if (runningDevice) {
      filters.push({
        loanStatus: "APPROVED",
        firstEmiDate: { $lte: new Date() }
      })
    }
    if (newDevice) {
      filters.push({
        loanStatus: "APPROVED",
        firstEmiDate: { $gte: new Date() }
      })
    }
    if (deactivateDevices) {
      filters.push({
        loanStatus: 'CLOSED'
      })

    }
    if (lockedDevices) {
      filters.push({
        deviceUnlockStatus: 'LOCKED'
      })

    }
    if (unlockDevices) {
      filters.push({
        deviceUnlockStatus: 'UNLOCKED',
        loanStatus: "APPROVED",
      })

    }
    if (notActiveDevices) {
      filters.push({
        loanStatus: 'PENDING'
      })

    }
    if (upcomingEmis) {
      filters.push({
        loanStatus: 'APPROVED',
        installments: {
          $elemMatch: {
            dueDate: { $gte: new Date() },
            status: 'PENDING'
          }
        }

      })
      sort = {
        "installments.dueDate": 1

      }
    }
    const finalFilter = {
      createdBy: new mongoose.Types.ObjectId(req.userId),

      ...(filters.length > 0 ? { $or: filters } : {})
    }

    if (!sort) {
      sort = {
        createdAt: -1
      }
    }




    const loans = await Loan.aggregate([
      { $match: finalFilter },

      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customerId"
        }
      },
      {
        $addFields: {
          installmentsPaid: {
            $size: {
              $filter: {
                input: {$ifNull:["$installments",[]]},
                as: "inst",
                cond: { $eq: ["$$inst.status", "PAID"] }
              }
            }
          }
        }
      }
      ,
      {
        $facet: {
          data: [
            { $sort: sort },
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }

    ])
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
              status: 'PENDING'

            }
          }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customerId'

        }
      },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
          ],
          totalCount: [
            { $count: "count" }
          ]
        }
      }

    ])
    const totalLoans = dueInstallments[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalLoans / limit);

    const pagination = {
      totalLoans: totalLoans,
      totalPages: totalPages,
      currentPage: page,
    };

    res
      .status(200)
      .json({ success: true, message: "Due installments fetched successfully", data: dueInstallments[0].data, pagination: pagination });
  } catch (error) {

    res
      .status(500)
      .json({
        success: false,
        message: "Error deleting customer loan",
        error: error.message,
      });
  }



}

module.exports = {
  createCustomerloan,
  getAllCustomersloan,
  getCustomerloanById,
  updateCustomerloan,
  deleteCustomerloan,
  getAllloans,
  getDueInstallments

};
