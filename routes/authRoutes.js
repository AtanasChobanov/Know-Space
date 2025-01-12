import express from "express";
import UserController from "../controllers/authController.js";
import passport from "passport";

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
router.post("/register", UserController.registerController);

router.get("/account/:userId", UserController.getAccountPage);

router.get("/edit-profile", UserController.getEditProfilePage);
router.post("/edit-profile", UserController.updateController);
router.post("/change-password", UserController.changePasswordController);

router.get("/logout", UserController.logoutController);

export default router;
