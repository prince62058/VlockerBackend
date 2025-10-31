const express = require("express");
const {
  createCustomerloan,
  getAllCustomersloan,
  getCustomerloanById,
  updateCustomerloan,
  deleteCustomerloan,
  getAllloans,
  getDueInstallments,
} = require("../controllers/CustomerLoan.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware)

router.get('/dueInstallments',getDueInstallments)
router.get("/:customerId", getAllCustomersloan);
router.get("/", getAllloans);
router.post("/:customerId", createCustomerloan);

router.get("/single/:loanId", getCustomerloanById);
router.put("/:loanId", updateCustomerloan);
router.delete("/:loanId", deleteCustomerloan);

module.exports = router;
