const express = require("express");
const {
  sendCustomerOtp,
  verifyOtpAndCreateCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  completeAadhaarKYC,
  completePanKYC,
  addBankPassbook,
} = require("../controllers/customer.controller");

const bankRouter = require("./CustomerBank.routes.js");
const authMiddleware = require("../middleware/auth.middleware.js");
const { uploadImage } = require("../middleware/upload.middleware.js"); // change export to object
const addressRouter = require("./CustomerAddress.routes");
const loanRouter = require("./CustomerLoan.routes.js");
const router = express.Router();

router.use(authMiddleware);
router.post("/send-otp", sendCustomerOtp);

// router.use("/:customerId/addresses", addressRouter);
// router.use("/:customerId/loans", loanRouter);

router.post("/verify-and-create", verifyOtpAndCreateCustomer);
router.get("/", getAllCustomers);
router.get("/:id", getCustomerById);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

router.put(
  "/:id/kyc/aadhaar",
  uploadImage.fields([
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
  ]),
  completeAadhaarKYC
);
router.put("/:id/kyc/pan", uploadImage.single("panPhoto"), completePanKYC);
router.put(
  "/:id/kyc/bankpassbook",
  uploadImage.single("bankPassbookPhoto"),
  addBankPassbook
);

// router.use("/:customerId/bank", bankRouter);

module.exports = router;
