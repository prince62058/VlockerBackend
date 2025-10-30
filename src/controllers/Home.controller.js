const { default: mongoose } = require("mongoose");
const Loan = require("../models/CustomerLoan.model");


exports.homeInfo=async (req,res)=>{

    const userId=req.userId
    
    console.log("Home Info accessed by user:",userId);
 const allData=await Loan.find({})
 console.log("All Loan Data for user:",allData);

    const query=Loan.aggregate([
        {
            $match:{
                createdBy:new mongoose.Types.ObjectId(userId),
                deviceUnlockStatus:"LOCKED"
            }
            
        },
        {

            $count:"totalLockedDevices"
        }
    ])
  const [homeData]= await Promise.all([query.exec()])

      const total={
        totalLockedDevices:homeData.length,
        totalEnrolledDevices:0,
        totalDeactivatedDevices:0,
        totalNotActiveDevices:0
      }



    res.status(200).json({succes:true,data:total})


}