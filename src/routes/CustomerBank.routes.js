const express = require("express");
const {
  addBank,
  getBanksByCustomer,
  getBankById,
  updateBank,
  deleteBank,
} = require("../controllers/CustomerBank.controller");

const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router({ mergeParams: true });  
router.use(authMiddleware);

router.post("/:customerId", addBank);

router.get("/:customerId", getBanksByCustomer);
router.get("/single/:bankId", getBankById);
router.put("/:bankId", updateBank);
router.delete("/:bankId", deleteBank);

module.exports = router;
