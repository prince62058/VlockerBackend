const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
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
    isProfileCompleted: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      sparse: true,
      default: null,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);


module.exports = User;
