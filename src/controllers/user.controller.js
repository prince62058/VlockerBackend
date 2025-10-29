const { default: mongoose } = require("mongoose");
const User = require("../models/UserModel.js");

const completeProfile = async (req, res) => {
  const { name, email } = req.body;
  const userId = req.userId;
  if (!name || !email) {
    return res
      .status(400)
      .json({ success: false, message: "Name and email are required" });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    user.name = name;
    user.email = email;

    user.isProfileCompleted = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile completed successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error completing profile",
      error: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .select("-phoneOtp.attempts -phoneOtp.codeHash");

    const totalUsers = await User.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);
    const pagination = {
      totalUsers,
      totalPages: totalPages,
      currentPage: page,
      pageSize: users.length,
    };

    res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      data: users,
      pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error retrieving users",
      error: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-phoneOtp.attempts -phoneOtp.codeHash"
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User found", data: user });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error finding user",
      error: error.message,
    });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const { name, email } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-phoneOtp.attempts -phoneOtp.codeHash");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Profile updated successfully", user });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};

module.exports = {
  completeProfile,
  getAllUsers,
  getUserById,
  updateUserProfile,
};
