const mongoose = require("mongoose");
const State = ["label1", "label2", "label3", "label4", "label5"];
const City = ["label1", "label2", "label3", "label4", "label5"];

const addressSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    customerAddress: {
      type: String,
    },
    customerState: {
      type: String,
      enum: State,
    },
    customerCity: {
      type: String,
      enum: City,
    },
    landmark: {
      type: String,
    },
    customerProfession: {
      type: String,
    },
    customerSalary: {
      type: Number,
    },
    customerContact1: {
      type: String,
    },
    customerContact2: {
      type: String,
    },
    otherInfo: {
      type: String,
    },
  },
  { timestamps: true }
);

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
