const mongoose = require("mongoose");
const User = require("./UserModel");

const keysSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    requestKeys: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

keysSchema.pre("findOneAndUpdate", async function (next) {
  const session = this.getOptions().session;
  const update = this.getUpdate();
  if (!update) {
    return next();
  }
  const payload = update.$set ? update.$set : update;
  const filter = this.getQuery();
  const oldDoc = await this.model.findOne(filter).session(session);
  console.log("inside update", update);
  console.log(payload);
  // If status changes to Approved (from Pending/Rejected)
  if (payload.status == "Approved" && oldDoc.status !== "Approved") {
    await User.findOneAndUpdate(
      oldDoc.userId,
      {
        $inc: {
          keys: oldDoc.requestKeys,
        },
      },
      { session }
    );
  }

  // If status changes to Rejected (from Approved) - Revert keys
  if (payload.status == "Rejected" && oldDoc.status == "Approved") {
    await User.findOneAndUpdate(
      oldDoc.userId,
      {
        $inc: {
          keys: -oldDoc.requestKeys,
        },
      },
      { session }
    );
  }
});
module.exports = mongoose.model("Keys", keysSchema);
