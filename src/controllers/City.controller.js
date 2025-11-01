const City = require("../models/City.model");

exports.createCity = async (req, res) => {
  try {
    const { cityName, stateId } = req.body;
    const city = await City.create({ cityName, stateId });
    return res.status(201).json({ success: true, data: city });
  } catch (error) {
    console.error("Error creating city:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getAllCities = async (req, res) => {
  try {
    const cities = await City.aggregate([
      {
        $lookup: {
          from: "states",
          localField: "stateId",
          foreignField: "_id",
          as: "stateDetails",
        },
      },
      { $unwind: "$stateDetails" },
      {
        $project: {
          _id: 1,
          cityName: 1,
          "stateDetails._id": 1,
          "stateDetails.stateName": 1,
        },
      },
    ]);

    res.status(200).json({ success: true, count: cities.length, data: cities });
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.getCitiesByState = async (req, res) => {
  try {
    const { stateId } = req.params;
    const cities = await City.find({ stateId });
    res.status(200).json({ success: true, count: cities.length, data: cities });
  } catch (error) {
    console.error("Error fetching cities by state:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.updateCity = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedCity = await City.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedCity)
      return res
        .status(404)
        .json({ success: false, message: "City not found" });

    res.status(200).json({ success: true, data: updatedCity });
  } catch (error) {
    console.error("Error updating city:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteCity = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCity = await City.findByIdAndDelete(id);
    if (!deletedCity)
      return res
        .status(404)
        .json({ success: false, message: "City not found" });

    res
      .status(200)
      .json({ success: true, message: "City deleted successfully" });
  } catch (error) {
    console.error("Error deleting city:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
