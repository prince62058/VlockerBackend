const Company = require("../models/Company.model.js");

const createSupportInfo = async (req, res) => {
  try {
    const existing = await Company.findOne();
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Support info already exists" });
    }

    const support = new Company(req.body);
    await support.save();

    res.status(201).json({
      success: true,
      message: "Support info created successfully",
      data: support,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateSupportInfo = async (req, res) => {
  try {
    const updateData = { ...req.body };
    for (const field_name in req.files) {
      const files = req.files[field_name]
       updateData.field_name=files.location
       console.log(files.location)
    }




    const updated = await Company.findOneAndUpdate({}, updateData, {
      new: true,
    });
    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Support info not found" });
    }

    res.status(200).json({
      success: true,
      message: "Support info updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSupportInfo = async (req, res) => {
  try {
    const support = await Company.findOne();
    if (!support) {
      return res
        .status(404)
        .json({ success: false, message: "No support info found" });
    }

    res.status(200).json({
      success: true,
      message: "Support info fetched successfully",
      data: support,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createSupportInfo,
  updateSupportInfo,
  getSupportInfo,
};
