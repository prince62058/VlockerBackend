const MobileModel = require("../models/MobileModel.model");
const MobileBrand = require("../models/MobileBrand.model");

const createModel = async (req, res) => {
  try {
    const brandExists = await MobileBrand.findById(req.body.brandId);
    if (!brandExists)
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });

    const model = await MobileModel.create(req.body);
    res.status(201).json({ success: true, data: model });
  } catch (error) {
    console.error("Error creating model:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAllModels = async (req, res) => {
  try {
    const models = await MobileModel.aggregate([
      {
        $lookup: {
          from: "mobilebrands",
          localField: "brandId",
          foreignField: "_id",
          as: "brandDetails",
        },
      },
      { $unwind: "$brandDetails" },
      {
        $project: {
          modelName: 1,
          brandName: "$brandDetails.brandName",
        },
      },
    ]);

    res.status(200).json({ success: true, count: models.length, data: models });
  } catch (error) {
    console.error("Error fetching models:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getModelById = async (req, res) => {
  try {
    const model = await MobileModel.findById(req.params.id).populate(
      "brandId",
      "brandName"
    );
    if (!model)
      return res
        .status(404)
        .json({ success: false, message: "Model not found" });
    res.status(200).json({ success: true, data: model });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateModel = async (req, res) => {
  try {
    const model = await MobileModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!model)
      return res
        .status(404)
        .json({ success: false, message: "Model not found" });
    res.status(200).json({ success: true, data: model });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteModel = async (req, res) => {
  try {
    const model = await MobileModel.findByIdAndDelete(req.params.id);
    if (!model)
      return res
        .status(404)
        .json({ success: false, message: "Model not found" });
    res
      .status(200)
      .json({ success: true, message: "Model deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  createModel,
  getAllModels,
  getModelById,
  updateModel,
  deleteModel,
};
