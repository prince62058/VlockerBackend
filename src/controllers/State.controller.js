const State = require("../models/State.model");

exports.createState = async (req, res) => {
  try {
    const { stateName } = req.body;
    const state = await State.create({ stateName });
    return res.status(201).json({ success: true, data: state });
  } catch (error) {
    console.error("Error creating state:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// exports.getAllStates = async (req, res) => {
//   try {
//     const states = await State.find().sort({ stateName: 1 });
//     res.status(200).json({ success: true, count: states.length, data: states });
//   } catch (error) {
//     console.error("Error fetching states:", error);
//     res.status(500).json({ success: false, message: "Internal server error" });
//   }
// };

exports.getAllStates = async (req, res) => {
  try {
    const statesWithCities = await State.aggregate([
      {
        $lookup: {
          from: "cities",
          localField: "_id",
          foreignField: "stateId",
          as: "cities",
        },
      },
      {
        $project: {
          _id: 1,
          stateName: 1,
          "cities._id": 1,
          "cities.cityName": 1,
        },
      },
      { $sort: { stateName: 1 } },
    ]);

    res.status(200).json({
      success: true,
      count: statesWithCities.length,
      data: statesWithCities,
    });
  } catch (error) {
    console.error("Error fetching states with cities:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.updateState = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedState = await State.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!updatedState)
      return res
        .status(404)
        .json({ success: false, message: "State not found" });

    res.status(200).json({ success: true, data: updatedState });
  } catch (error) {
    console.error("Error updating state:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

exports.deleteState = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedState = await State.findByIdAndDelete(id);
    if (!deletedState)
      return res
        .status(404)
        .json({ success: false, message: "State not found" });

    res
      .status(200)
      .json({ success: true, message: "State deleted successfully" });
  } catch (error) {
    console.error("Error deleting state:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
