const express = require("express");
const {
  createAddress,
  getAddressesForCustomer,
  getAddressById,
  updateAddress,
  deleteAddress,
} = require("../controllers/CustomerAddress.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

router.post("/:customerId", createAddress);
router.get("/", getAddressesForCustomer);
router.get("/:customerId", getAddressById);
router.put("/:addressId", updateAddress);
router.delete("/:addressId", deleteAddress);

module.exports = router;
