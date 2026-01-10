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
const validateRequest = require("../middleware/validateRequest.js");
const {
  createLoanSchema,
  updateLoanSchema,
  paramIdSchema,
} = require("../validations/customerloanValidation.js");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.get('/dueInstallments',getDueInstallments)
router.get("/:customerId", getAllCustomersloan);

router.get("/", getAllloans);

router.post(
  "/:customerId",
  validateRequest(createLoanSchema),
  createCustomerloan
);

router.get("/single/:loanId", getCustomerloanById);

router.put("/:loanId", validateRequest(updateLoanSchema), updateCustomerloan);

router.delete("/:loanId", deleteCustomerloan);

module.exports = router;
