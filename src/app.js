const express = require("express");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const addressRoutes = require("./routes/CustomerAddress.routes");
const bankRoutes = require("./routes/CustomerBank.routes");
const customerRoutes = require("./routes/customer.routes");
const customerLoan = require("./routes/CustomerLoan.routes");
const feedbackRoutes = require("./routes/Feedback.routes");
const InstallationVideoRoutes = require("./routes/InstallationVideo.routes");
const companySupportRoutes = require("./routes/Company.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/customerLoan", customerLoan);
app.use("/api/address", addressRoutes);
app.use("/api/bank", bankRoutes);
app.use("/api/feedback", feedbackRoutes);

app.use("/api/upload", InstallationVideoRoutes);

app.use("/api/support", companySupportRoutes);
app.get("/", (req, res) => {
  res.send("Welcome to V Locker App API");
});

module.exports = app;
