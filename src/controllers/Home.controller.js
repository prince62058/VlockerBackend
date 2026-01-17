const mongoose = require("mongoose");
const Loan = require("../models/CustomerLoan.model");
const User = require("../models/UserModel");
const Customer = require("../models/Customer.model");

exports.homeInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);

    // If user is a customer (role 'user' or has no specific role defined, usually 'user')
    // We want to show their specific loan details.
    if (user && user.role === "user") {
      const customer = await Customer.findOne({
        customerMobileNumber: user.phone,
      });

      if (!customer) {
        return res.status(200).json({
          success: true,
          data: { message: "No customer profile found" },
        });
      }

      // Find active loan for this customer
      // Active usually means APPROVED and not CLOSED, or specifically checking deviceUnlockStatus
      // We'll take the latest APPROVED or LOCKED loan.
      const loan = await Loan.findOne({
        customerId: customer._id,
        loanStatus: { $in: ["APPROVED", "ACTIVE"] }, // Assuming APPROVED is the status for active loans
      }).sort({ createdAt: -1 });

      if (!loan) {
        return res
          .status(200)
          .json({ success: true, data: { message: "No active loan found" } });
      }

      // Construct response for dashboard
      const dashboardData = {
        isCustomer: true,
        nextDueDate: loan.nextDueDate || "N/A", // You might need to calculate next due date from installments
        amount: loan.emiAmount || 0,
        status: loan.deviceUnlockStatus || loan.loanStatus,
        customerName: customer.customerName,
      };

      // If you want next due date specifically from installments:
      if (loan.installments && loan.installments.length > 0) {
        const pendingInstallment = loan.installments.find(
          (i) => i.status === "PENDING" || i.status === "OVERDUE"
        );
        if (pendingInstallment) {
          dashboardData.nextDueDate = pendingInstallment.dueDate;
          dashboardData.amount = pendingInstallment.amount;
          dashboardData.status =
            pendingInstallment.status === "OVERDUE"
              ? "Overdue"
              : loan.deviceUnlockStatus;
        }
      }

      // Dynamic Notification Logic
      let notificationMsg = "Welcome to Vlocker! No new notifications.";
      if (dashboardData.status === "LOCKED") {
        notificationMsg =
          "Your device is LOCKED due to overdue payment. Please pay immediately.";
      } else if (dashboardData.status === "Overdue") {
        notificationMsg =
          "Your payment is overdue. Please pay immediately to avoid service interruption.";
      } else if (
        dashboardData.status === "APPROVED" ||
        dashboardData.status === "ACTIVE" ||
        dashboardData.status === "UNLOCKED"
      ) {
        notificationMsg = "Your loan is active. Please pay your EMI on time.";
      }

      dashboardData.notification = notificationMsg;

      return res.status(200).json({ success: true, data: dashboardData });
    }

    // Default Admin/Shop Logic
    const allData = await Loan.find({});

    const query = Loan.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(userId),
          deviceUnlockStatus: "LOCKED",
        },
      },
      {
        $count: "totalLockedDevices",
      },
    ]);
    const query2 = Loan.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(userId),
          loanStatus: "CLOSED",
        },
      },
      {
        $count: "totalDeactivatedDevice",
      },
    ]);
    const query3 = Loan.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(userId),
          loanStatus: "PENDING",
        },
      },

      {
        $count: "totalNotActiveDevices",
      },
    ]);
    const query4 = Loan.aggregate([
      {
        $match: {
          createdBy: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $count: "totalEnrolledDevices",
      },
    ]);
    const [lockedDevices, deactivateDevice, notActiveDevice, enrolledDevice] =
      await Promise.all([query.exec(), query2, query3, query4]);

    const total = {
      totalLockedDevices: lockedDevices[0]?.totalLockedDevices || 0,
      totalEnrolledDevices: enrolledDevice[0]?.totalEnrolledDevices || 0,
      totalDeactivatedDevices: deactivateDevice[0]?.totalDeactivatedDevice || 0,
      totalNotActiveDevices: notActiveDevice[0]?.totalNotActiveDevices || 0,
    };

    res.status(200).json({ succes: true, data: total });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "failed to fetch data",
      error: error.message,
    });
  }
};

exports.adminHomeInfo = async (req, res) => {
  try {
    const { year } = req.query;
    const query = Loan.aggregate([
      {
        $match: {
          deviceUnlockStatus: "LOCKED",
        },
      },
      {
        $count: "totalLockedDevices",
      },
    ]);
    const query2 = Loan.aggregate([
      {
        $match: {
          loanStatus: "CLOSED",
        },
      },
      {
        $count: "totalDeactivatedDevice",
      },
    ]);
    const query3 = Loan.aggregate([
      {
        $match: {
          loanStatus: "PENDING",
        },
      },

      {
        $count: "totalPendingLoans",
      },
    ]);
    const query4 = Loan.aggregate([
      {
        $count: "totalEnrolledDevices",
      },
    ]);
    const query5 = User.countDocuments({});
    const query6 = User.countDocuments({
      isDisabled: false,
    });
    const query7 = User.countDocuments({
      isDisabled: true,
    });
    const query8 = Loan.aggregate([
      {
        $match: {
          loanStatus: "APPROVED",
        },
      },
      {
        $count: "totalApprovedLoans",
      },
    ]);
    const query9 = Loan.aggregate([
      {
        $match: {
          loanStatus: "REJECTED",
        },
      },
      {
        $count: "totalRejectedLoans",
      },
    ]);
    let query10 = null;
    if (year) {
      const yearInt = parseInt(year);
      const startDate = new Date(yearInt, 0, 1);
      const endDate = new Date(yearInt + 1, 0, 1);

      query10 = User.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            count: { $sum: 1 },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);
    }

    const queries = [
      query.exec(),
      query2,
      query3,
      query4,
      query5,
      query6,
      query7,
      query8,
      query9,
    ];

    if (query10) {
      queries.push(query10);
    }

    const results = await Promise.all(queries);

    const [
      lockedDevicess,
      deactivateDevices,
      pendingDevices,
      allDevices,
      totalUsers,
      totalActiveUsers,
      totalDisabledUsers,
      totalApprovedLoans,
      totalRejectedLoans,
      monthlyUsers,
    ] = results;

    const total = {
      totalLockedDevices: lockedDevicess[0]?.totalLockedDevices || 0,
      totalEnrolledDevices: allDevices[0]?.totalEnrolledDevices || 0,
      totalDeactivatedDevices:
        deactivateDevices[0]?.totalDeactivatedDevice || 0,
      totalApprovedLoans: totalApprovedLoans[0]?.totalApprovedLoans || 0,
      totalRejectedLoans: totalRejectedLoans[0]?.totalRejectedLoans || 0,
      totalPendingLoans: pendingDevices[0]?.totalPendingLoans || 0,
      totalUsers: totalUsers,
      totalActiveUsers: totalActiveUsers,
      totalDisabledUsers: totalDisabledUsers,
    };

    if (year && monthlyUsers) {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const monthlyData = monthNames.map((name, index) => 0);

      monthlyUsers.forEach((item) => {
        monthlyData[item._id - 1] = item.count;
      });

      total.monthlyUserRegistrations = monthlyData;
    }

    res.status(200).json({ success: true, data: total });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "failed to fetch data",
      error: error.message,
    });
  }
};
