const Device = require("../models/Device.model");
const Loan = require("../models/CustomerLoan.model");
const Customer = require("../models/Customer.model");

// Mock FCM service for now - replace with actual implementation later
const sendMockFCM = async (deviceId, data) => {
  console.log(`[FCM-MOCK] Sending to ${deviceId}:`, data);
};

exports.registerDevice = async (req, res) => {
  try {
    const { deviceId, loanId, customerId, fcmToken } = req.body;

    // Validate if loan exists
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    let device = await Device.findOne({ deviceId });

    if (device) {
      // Update existing device
      device.loanId = loanId;
      device.customerId = customerId;
      device.fcmToken = fcmToken;
      device.lastSync = Date.now();
      await device.save();
    } else {
      // Create new device
      device = await Device.create({
        deviceId,
        loanId,
        customerId,
        fcmToken,
      });
    }

    res.status(200).json({
      success: true,
      message: "Device registered successfully",
      device,
    });
  } catch (error) {
    console.error("Register Device Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.lockDevice = async (req, res) => {
  try {
    const { deviceId } = req.body;

    const device = await Device.findOneAndUpdate(
      { deviceId },
      { isLocked: true, lockStatus: "LOCKED" },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    // Send Command via FCM/Socket
    const payload = {
      type: "COMMAND",
      action: "LOCK_DEVICE",
      payload: { message: "EMI Overdue. Please Pay." },
    };
    await sendMockFCM(deviceId, payload);

    // If you have socket.io instance globally available:
    // global.io.to(deviceId).emit('command', { action: 'LOCK' });

    res.json({ success: true, message: "Lock command sent", device });
  } catch (error) {
    console.error("Lock Device Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.unlockDevice = async (req, res) => {
  try {
    const { deviceId } = req.body;

    const device = await Device.findOneAndUpdate(
      { deviceId },
      { isLocked: false, lockStatus: "UNLOCKED" },
      { new: true }
    );

    if (!device) {
      return res.status(404).json({ message: "Device not found" });
    }

    // Send Command via FCM/Socket
    const payload = {
      type: "COMMAND",
      action: "UNLOCK_DEVICE",
    };
    await sendMockFCM(deviceId, payload);

    // global.io.to(deviceId).emit('command', { action: 'UNLOCK' });

    res.json({ success: true, message: "Unlock command sent", device });
  } catch (error) {
    console.error("Unlock Device Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getDeviceStatus = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await Device.findOne({ deviceId }).populate("loanId");

    if (!device) return res.status(404).json({ message: "Device not found" });

    res.json({ success: true, device });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
