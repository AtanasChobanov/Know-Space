import express from "express";
import UserController from "../controllers/authController.js";
import passport from "passport";
import { uploadFiles } from "../config/multer.js";

const router = express.Router();

router.get("/login", UserController.getLoginPage);
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

router.get("/login/google", passport.authenticate("google"));
router.get(
  "/auth/google",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

router.get("/register", UserController.getRegisterPage);
router.post("/register", UserController.register);

router.get("/account/:userId", UserController.getAccountPage);

router.get("/edit-profile", UserController.getEditProfilePage);
router.post("/edit-profile", UserController.update);

router.post("/change-password", UserController.changePassword);

router.patch("/change-profile-picture", uploadFiles, UserController.changeProfilePicture);
router.delete("/delete-profile-picture", UserController.deleteProfilePicture);

router.get("/logout", UserController.logout);

export default router;
