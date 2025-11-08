const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Authorization token is required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded)
    req.userId = decoded.userId;
    req.role = decoded.role;

    if (req.role === 'admin' && req.query.userId) {
      req.userId = req.query.userId;
    }
    // if (req.role !== 'admin') {
    //   const isExist = await User.findById(req.userId);
    //   if(isExist.isDisabled){

    //     return res
    //     .status(409)
    //     .json({ success: false, message: "user is disabled or forbidden" });
    //   }

    // }

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
