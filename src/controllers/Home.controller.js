const { default: mongoose } = require("mongoose");
const Loan = require("../models/CustomerLoan.model");


exports.homeInfo = async (req, res) => {

    const userId = req.userId

    const allData = await Loan.find({})

    const query = Loan.aggregate([
        {
            $match: {
                createdBy: new mongoose.Types.ObjectId(userId),
                deviceUnlockStatus: "LOCKED"
            }

        },
        {

            $count: "totalLockedDevices"
        }
    ])
    const query2 = Loan.aggregate([
        {
            $match: {
                createdBy: new mongoose.Types.ObjectId(userId),
                loanStatus: "CLOSED"

            },
        },
        {

            $count: "totalDeactivatedDevice"
        }


    ])
    const query3 = Loan.aggregate([
        {
            $match: {
                createdBy: new mongoose.Types.ObjectId(userId),
                loanStatus: "PENDING"

            }
        },

        {

            $count: "totalNotActiveDevices"
        }



    ])
    const query4 = Loan.aggregate([
        {
            $match: {
                createdBy: new mongoose.Types.ObjectId(userId),
            }
        },
        {

            $count: "totalEnrolledDevices"
        }

    ])
    const [lockedDevices, deactivateDevice, notActiveDevice, enrolledDevice] = await Promise.all([
        query.exec(),
        query2,
        query3,
        query4
        
    ])

    const total = {
        totalLockedDevices: lockedDevices[0]?.totalLockedDevices || 0,
        totalEnrolledDevices: enrolledDevice[0]?.totalEnrolledDevices || 0,
        totalDeactivatedDevices: deactivateDevice[0]?.totalDeactivatedDevice || 0,
        totalNotActiveDevices: notActiveDevice[0]?.totalNotActiveDevices || 0
    }



    res.status(200).json({ succes: true, data: total })


}