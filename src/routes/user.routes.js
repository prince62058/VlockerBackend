const express = require("express");
const {
  completeProfile,
  getAllUsers,
  getUserById,
  updateUserProfile,
  updateBusinessProfile,
  getBusinesProfileByUserId,
  toggleUser,
} = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const validateRequest = require("../middleware/validateRequest");
const {
  completeProfileSchema,
  updateUserProfileSchema,
  paramIdSchema,
} = require("../validations/userValidation");
const { uploadImage } = require("../middleware/upload.middleware");

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
  uploadImage.single('profileImage'),
  updateUserProfile
);
router.put('/businessProfile',uploadImage.single('profileImage'), updateBusinessProfile)

router.get("/businessProfile", getBusinesProfileByUserId);
router.get("/:id", getUserById);
router.patch('/disable/:userId',toggleUser)
module.exports = router;
