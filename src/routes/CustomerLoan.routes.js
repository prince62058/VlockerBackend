const express = require("express");
const {
  createCustomerloan,
  getAllCustomersloan,
  getCustomerloanById,
  updateCustomerloan,
  deleteCustomerloan,
} = require("../controllers/CustomerLoan.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware)

router.get("/:customerId", getAllCustomersloan);
router.post("/:customerId", createCustomerloan);

router.get("/single/:loanId", getCustomerloanById);
router.put("/:loanId", updateCustomerloan);
router.delete("/:loanId", deleteCustomerloan);

module.exports = router;
