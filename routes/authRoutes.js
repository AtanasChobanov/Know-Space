import express from "express";
import {
  getLoginPage,
  getRegisterPage,
  registerUser,
  logoutUser,
  getEditProfilePage,
  updateProfile,
  changePassword,
  getAccount,
} from "../controllers/authController.js";
import passport from "passport";

const router = express.Router();

router.get("/login", getLoginPage);
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

router.get("/register", getRegisterPage);
router.post("/register", registerUser);

router.get("/account/:user_id", getAccount);

router.get("/edit-profile", getEditProfilePage);
router.post("/edit-profile", updateProfile);
router.post("/change-password", changePassword);

router.get("/logout", logoutUser);

export default router;
