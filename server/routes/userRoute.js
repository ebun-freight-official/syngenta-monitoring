const express = require("express");
const { upload } = require("../middlewares/multerCloudinary");
const authenticateToken = require("../middlewares/auth");
const {
  loginUser,
  logoutUser,
  getCurrentUser,
  getAllUsers,
  updateUser,
  createUser,
  hardDeleteUser,
  softDeleteUser,
  restoreUser,
} = require("../controllers/userController");

const router = express.Router();

router.post("/login", loginUser);
router.post("/logout", authenticateToken, logoutUser);

router.route("/").get(authenticateToken, getAllUsers);

router.post(
  "/create-user",
  authenticateToken,
  upload.single("image"),
  createUser,
);

router.get("/current-user", authenticateToken, getCurrentUser);

router
  .route("/:id")
  .patch(authenticateToken, upload.single("image"), updateUser);

// delete routes
router.delete("/hard-delete/:id", authenticateToken, hardDeleteUser);
router.delete("/soft-delete/:id", authenticateToken, softDeleteUser);
router.patch("/restore/:id", authenticateToken, restoreUser);

module.exports = router;
