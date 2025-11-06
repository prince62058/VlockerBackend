const mongoose = require('mongoose');
const Keys = require("../models/KeysModel");

const requestKeys = async (req, res) => {
    try {
        const userId = req.userId;
        const requestedKeys = req?.body?.requestKeys;

        if (!userId) {
            return res.status(401).json({
                status: false,
                message: "User authentication required"
            });
        }

        if (!requestedKeys || requestedKeys.length === 0) {
            return res.status(400).json({
                status: false,
                message: "Request keys are required"
            });
        }

        const newRequestKeys = await Keys.create({
            userId: userId,
            requestKeys: requestedKeys
        });

        return res.status(200).json({
            status: true,
            message: "Keys requested successfully",
            data: newRequestKeys
        });

    } catch (error) {


        return res.status(500).json({
            status: false,
            message: "Failed to request keys",
            error: error.message
        });
    }
};

const updateStatus = async (req, res) => {
    const session = await mongoose.startSession();

    try {
        const keyId = req.params.keyId;
      

        if (!keyId) {
            return res.status(400).json({
                status: false,
                message: "Key ID is required"
            });
        }

        if (!req.body.status) {
            return res.status(400).json({
                status: false,
                message: "Status is required"
            });
        }

        if (!mongoose.Types.ObjectId.isValid(keyId)) {
            return res.status(400).json({
                status: false,
                message: "Invalid key ID format"
            });
        }

        session.startTransaction();

        const isExist = await Keys.findOne({
            _id: keyId
        }).session(session);

        if (!isExist) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({
                status: false,
                message: "Requested key does not exist"
            });
        }

        if (isExist.status !== 'Pending') {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                status: false,
                message: "Requested key should be in Pending state",
                currentStatus: isExist.status
            });
        }

        const data = await Keys.findOneAndUpdate(
            { _id: new mongoose.Types.ObjectId(keyId) },
             req.body,
            { new: true, session: session }
        );

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({
            status: true,
            message: "Status updated successfully",
            data: data
        });

    } catch (error) {

        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();



        return res.status(500).json({
            status: false,
            message: "Failed to update status",
            error: error.message
        });
    }
};

const userkeyHistory = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const userId = req.userId;

        const allKeys = await Keys.find({
            userId: userId
        }).sort({ createdAt: -1 }).skip(skip).limit(limit)
        const totalKeys = await Keys.countDocuments({
            userId:userId
        });
        const totalPages = Math.ceil(totalKeys / limit);

        const pagination = {
            totalKeys: totalKeys,
            totalPages: totalPages,
            currentPage: page,
            limit: limit,
        };
        return res.status(200).json({
            status: true,
            message: "key history fetched successfully",
            data: allKeys,
            pagination:pagination
        });
    } catch (error) {

        return res.status(500).json({
            status: false,
            message: "Failed to fetch keys history",
            error: error.message
        });
    }

}
const allKeys = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const allKeys = await Keys.find({}).sort({ creatdAt: -1 }).skip(skip).limit(limit)
        const totalKeys = await Keys.countDocuments({});
        const totalPages = Math.ceil(totalKeys / limit);

        const pagination = {
            totalKeys: totalKeys,
            totalPages: totalPages,
            currentPage: page,
            limit: limit,
        };
        return res.status(200).json({
            status: true,
            message: "all keys fetched successfully",
            data: allKeys,
            pagination:pagination
        });
    } catch (error) {

        return res.status(500).json({
            status: false,
            message: "Failed to fetch all keys",
            error: error.message
        });
    }

}

module.exports = {
    requestKeys,
    updateStatus,
    userkeyHistory,
    allKeys
};