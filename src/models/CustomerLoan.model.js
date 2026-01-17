const mongoose = require("mongoose");

const customerloanSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    amountLeft: {
      type: Number,
      default: 0,
    },
    installmentsPaid: {
      type: Number,
      default: 0,
    },
    installationType: {
      type: String,
      enum: ["New Phone", "Old/Running Phone"],
    },
    mobileBrand: {
      type: String,
    },
    mobileModel: {
      type: String,
    },
    imeiNumber1: {
      type: String,
      unique: true,
    },
    imeiNumber2: {
      type: String,
    },
    mobilePrice: {
      type: Number,
    },
    processingFees: {
      type: Number,
      default: 0,
    },
    downPayment: {
      type: Number,
      default: 0,
    },
    frequency: {
      type: String,
      enum: ["monthly", "weekly", "daily"],
      default: "monthly",
    },
    numberOfEMIs: {
      type: Number,
      default: 0,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    loanAmount: {
      type: Number,
    },
    emiAmount: {
      type: Number,
    },
    firstEmiDate: {
      type: Date,
    },
    financer: {
      type: String,
      enum: ["admin", "shop owner"],
    },
    paymentOptions: {
      type: String,
      enum: ["cash", "upi", "autopay/autodebit"],
    },
    description: {
      type: String,
    },
    autoUnlock: {
      type: Boolean,
      default: false,
    },
    emiStartDate: {
      type: Date,
    },
    emiEndDate: {
      type: Date,
    },
    loanStatus: {
      type: String,
      enum: ["APPROVED", "PENDING", "REJECTED", "CLOSED"],
      default: "PENDING",
    },
    deviceUnlockStatus: {
      type: String,
      enum: ["LOCKED", "UNLOCKED"],
      default: "UNLOCKED",
    },
    installments: [
      {
        installmentNumber: {
          type: Number,
        },
        dueDate: {
          type: Date,
        },
        amount: {
          type: Number,
        },
        status: {
          type: String,
          enum: ["PENDING", "PAID", "OVERDUE", "PARTIAL"],
          default: "PENDING",
        },
        paidAmount: {
          type: Number,
          default: 0,
        },
        paidDate: {
          type: Date,
        },
        paymentMethod: {
          type: String,
          enum: ["cash", "upi", "autopay/autodebit"],
        },
        lateFee: {
          type: Number,
          default: 0,
        },
        remarks: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

customerloanSchema.pre("save", async function (next) {
  try {
    const userId = this.createdBy;

    if (!userId) {
      console.log("No createdBy on this doc");
      return next();
    }

    await mongoose
      .model("User")
      .findOneAndUpdate({ _id: userId }, { $inc: { keys: -1 } }, { new: true });

    next();
  } catch (err) {
    next(err);
  }
});

const Loan = mongoose.model("Loan", customerloanSchema);

module.exports = Loan;
