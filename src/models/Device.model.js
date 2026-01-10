const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true, // IMEI or Android ID
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
    },
    fcmToken: {
      type: String,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockStatus: {
      type: String,
      enum: ["LOCKED", "UNLOCKED", "GracePeriod"],
      default: "UNLOCKED",
    },
    appVersion: {
      type: String,
    },
    lastSync: {
      type: Date,
      default: Date.now,
    },
    provisioningToken: {
      type: String, // Temporary token used during QR scan handshake
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Device", deviceSchema);
