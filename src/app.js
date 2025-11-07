const express = require("express");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const addressRoutes = require("./routes/CustomerAddress.routes");
const bankRoutes = require("./routes/CustomerBank.routes");
const customerRoutes = require("./routes/customer.routes");
const customerLoan = require("./routes/CustomerLoan.routes");
const feedbackRoutes = require("./routes/Feedback.routes");
const InstallationVideoRoutes = require("./routes/InstallationVideo.routes");
const companySupportRoutes = require("./routes/Company.routes");
const homeRoutes = require("./routes/Home.routes");
const contactusRoutes = require("./routes/ContactUs.routes");
const stateRoutes = require("./routes/State.routes");
const cityRoutes = require("./routes/City.routes");
const mobileBrandRoutes = require("./routes/MobileBrand.routes");
const mobileModelRoutes = require("./routes/MobileModel.routes");
const  keysRoutes=require('./routes/keys.routes')
const  notification=require('./routes/Notification.routes')


const app = express();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP, please try again later.",
    });
  },
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter);
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customerLoan", customerLoan);
app.use("/api/address", addressRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/contactUs", contactusRoutes);

app.use("/api/states", stateRoutes);
app.use("/api/cities", cityRoutes);

app.use("/api/mobile-brands", mobileBrandRoutes);
app.use("/api/mobile-models", mobileModelRoutes);

app.use("/api/upload", InstallationVideoRoutes);
app.use("/api/keys", keysRoutes);
app.use("/api/notification",notification);
// app.set("trust proxy", true);

app.use("/api/company", companySupportRoutes);
app.get("/", (req, res) => {
  res.send("Welcome to V Locker App API");
});

module.exports = app;
