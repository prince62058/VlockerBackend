const mongoose = require("mongoose");

const companySupportSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      default: "V-Locker App",
    },
    timings: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    website: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    whatsappNumber: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CompanySupport", companySupportSchema);
