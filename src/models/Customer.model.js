const mongoose = require("mongoose");
const Brands = ["label1", "label2", "label3", "label4", "label5"];
const models = ["label1", "label2", "label3", "label4", "label5"];

const customerSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customerName: {
      type: String,
      trim: true, 
    },
    customerMobileNumber: {
      type: String,
      unique: true,  
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    phoneOtp: {
      codeHash: {
        type: String,
        select: false,
      },
      expiresAt: {
        type: Date,
      },
      attempts: {
        type: Number,
        default: 0,
      },
      lastSentAt: {
        type: Date,
      },
    },
    resetToken: {
      token: String,
      expiresAt: Date,
    },
    // otpExpires: {
    //   type: Date,
    // },
    isVerified: {
      type: Boolean,
      default: false,  
    },

    kyc: {
      aadhaar: {
        number: { type: String },
        frontPhoto: { type: String },
        backPhoto: { type: String },
      },
      pan: {
        number: { type: String },
        photo: { type: String },
      },
      bankPassbook: {
        photo: { type: String },
      },
    },
  },
  { timestamps: true }
);

customerSchema.virtual('Loan',{
  ref: 'Loan',
  localField: '_id',
  foreignField: 'customerId',
})
customerSchema.virtual('Bank',{
  ref: 'Bank',
  localField: '_id',
  foreignField: 'customerId',
})
customerSchema.virtual('Address',{
  ref: 'Address',
  localField: '_id',
  foreignField: 'customerId',
})
customerSchema.set('toObject',{virtuals:true});
customerSchema.set('toJSON',{virtuals:true});
const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
