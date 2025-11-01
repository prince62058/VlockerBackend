const MobileBrand = require("../models/MobileBrand.model");

const createBrand = async (req, res) => {
  try {
    const brand = await MobileBrand.create(req.body);
    res.status(201).json({ success: true, data: brand });
  } catch (error) {
    console.error("Error creating brand:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getAllBrands = async (req, res) => {
  try {
    const brands = await MobileBrand.find();
    res.status(200).json({ success: true, count: brands.length, data: brands });
  } catch (error) {
    console.error("Error fetching brands:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const getBrandById = async (req, res) => {
  try {
    const brand = await MobileBrand.findById(req.params.id);
    if (!brand)
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });
    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const updateBrand = async (req, res) => {
  try {
    const brand = await MobileBrand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!brand)
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });
    res.status(200).json({ success: true, data: brand });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const brand = await MobileBrand.findByIdAndDelete(req.params.id);
    if (!brand)
      return res
        .status(404)
        .json({ success: false, message: "Brand not found" });
    res
      .status(200)
      .json({ success: true, message: "Brand deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand,
};
