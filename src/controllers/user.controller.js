const { default: mongoose } = require("mongoose");
const User = require("../models/UserModel.js");
const Business = require("../models/BusinessProfile.js");

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
const getBusinesProfileByUserId = async (req, res) => {
  try {
    const userId=new mongoose.Types.ObjectId(req.userId)
 console.log(userId,"sadadasdasds")
    const user = await Business.findOne({
      userId:userId
    })
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Business profile not found" });
    }
    res.status(200).json({ success: true, message: "Business profile  found", data: user });
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

    const { name, email,dateOfBirth,profileUrl } = req.body;
    const updateData = {};
   
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (profileUrl) updateData.profileUrl = profileUrl;
    

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
      .json({ success: true, message: "Profile updated successfully", data:user });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
};
const updateBusinessProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const { name, email,phone , profileUrl } = req.body;
    const updateData = {};

    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (userId) updateData.userId = userId;
    if (profileUrl) updateData.profileUrl = profileUrl;


    const user = await Business.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true  ,upsert:true}
    )

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Business profile updated successfully",data:user });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating Business profile",
      error: error.message,
    });
  }
};

module.exports = {
  completeProfile,
  getAllUsers,
  getUserById,
  updateUserProfile,
  updateBusinessProfile,
  getBusinesProfileByUserId
};
