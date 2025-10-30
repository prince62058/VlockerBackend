const express = require("express");
const {
  completeProfile,
  getAllUsers,
  getUserById,
  updateUserProfile,
} = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const validateRequest = require("../middleware/validateRequest");
const {
  completeProfileSchema,
  updateUserProfileSchema,
  paramIdSchema,
} = require("../validations/userValidation");

const router = express.Router();

router.use(authMiddleware);

// router.post("/complete-profile", authMiddleware, completeProfile);
// router.get("/", getAllUsers);
// router.put("/", updateUserProfile);
// router.get("/:id", getUserById);

router.post(
  "/complete-profile",
  validateRequest(completeProfileSchema, "body"),
  completeProfile
);

router.get("/", getAllUsers);

router.put(
  "/",
  validateRequest(updateUserProfileSchema, "body"),
  updateUserProfile
);

router.get("/:id", getUserById);

module.exports = router;
