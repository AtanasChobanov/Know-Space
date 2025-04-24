import User from "../models/userModel.js";

class UserController {
  static getRegisterPage(req, res) {
    res.render("register");
  }

  static getLoginPage(req, res) {
    res.render("login");
  }

  static async register(req, res) {
    const { username, email, password, type } = req.body;

    try {
      const existingUser = await User.getForeignUserByEmail(email);

      if (existingUser) {
        res.render("register", {
          errorMessage: "Имейлът е вече регистриран. Пробвайте да влезете.",
        });
      } else if (password === "google") {
        res.render("register", {
          errorMessage: "Невалидна парола.",
        });
      } else {
        const user = await User.create(email, username, password, type, null);

        req.login(user, (err) => {
          if (err) {
            console.error("Error during login:", err);
          }
          res.redirect("/");
        });
      }
    } catch (err) {
      res.render("error-message", { errorMessage: err });
    }
  }

  static async getAccountPage(req, res) {
    if (req.isAuthenticated()) {
      const userId = req.params.userId;

      try {
        const account = await User.getForeignUserById(userId);

        if (!account) {
          return res.status(404).render("error-message", {
            errorMessage: "Потребителят не е намерен",
          });
        }

        const posts = await account.getPosts();
        res.render("profile", { account, posts });
      } catch (err) {
        console.error("Error fetching profile:", err.stack);
        res.status(500).render("error-message", {
          errorMessage: "Error fetching profile",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static getEditProfilePage(req, res) {
    if (req.isAuthenticated()) {
      res.render("edit-profile");
    } else {
      res.redirect("/login");
    }
  }

  static async update(req, res) {
    if (req.isAuthenticated()) {
      try {
        const user = await User.getForeignUserById(req.user.userId);
        await user.update(req.body.username, req.body.bio);

        req.logout((err) => {
          if (err) {
            console.error("Error during logout:", err);
            return res.status(500).render("error-message", {
              errorMessage:
                "Грешка при обновяване на сесията. Моля, опитайте отново.",
            });
          }

          req.login(user, (err) => {
            if (err) {
              console.error("Error during re-login:", err);
              return res.status(500).render("error-message", {
                errorMessage: "Грешка при влизане след редактиране на профила.",
              });
            }
            res.redirect("/account/" + req.user.userId);
          });
        });
      } catch (err) {
        console.log("Error updating profile:", err);
        res.status(500).render("error-message", {
          errorMessage: "Неуспешно актуализиран на профила.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async changePassword(req, res) {
    if (req.isAuthenticated()) {
      const { oldPassword, newPassword, confirmPassword } = req.body;
      try {
        if (newPassword !== confirmPassword || newPassword === "google") {
          return res.render("edit-profile", {
            errorMessage: "Невалидна нова парола.",
          });
        }

        const user = await User.getForeignUserById(req.user.userId);
        const updatedUser = await user.updatePassword(oldPassword, newPassword);

        if (updatedUser.errorMessage) {
          return res.render("edit-profile", {
            errorMessage: updatedUser.errorMessage,
          });
        }
        
        req.logout((err) => {
          if (err) {
            console.error("Error during logout:", err);
            return res.status(500).render("error-message", {
              errorMessage:
                "Грешка при обновяване на сесията. Моля, опитайте отново.",
            });
          }

          req.login(updatedUser, (err) => {
            if (err) {
              console.error("Error during re-login:", err);
              return res.status(500).render("error-message", {
                errorMessage: "Грешка при влизане след смяна на паролата.",
              });
            }
            res.redirect("/account/" + req.user.userId);
          });
        });
      } catch (err) {
        console.error("Error changing password:", err);
        res.status(500).render("error-message", {
          errorMessage: "Грешка при смяната на паролата. Опитайте отново.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async changeProfilePicture(req, res) {
    if (req.isAuthenticated()) {
      try {
        const user = await User.getForeignUserById(req.user.userId);
        if (req.uploadedFiles) {
          await user.updateProfilePicture(req.uploadedFiles[0]);
        }

        req.logout((err) => {
          if (err) {
            console.error("Error during logout:", err);
            return res.status(500).render("error-message", {
              errorMessage:
                "Грешка при обновяване на сесията. Моля, опитайте отново.",
            });
          }

          req.login(user, (err) => {
            if (err) {
              console.error("Error during re-login:", err);
              return res.status(500).render("error-message", {
                errorMessage: "Грешка при влизане след смяна на профилната снимка.",
              });
            }
            res.redirect("/account/" + req.user.userId);
          });
        });
      } catch (err) {
        console.error("Error changing profile picture:", err);
        res.status(500).render("error-message", {
          errorMessage: "Грешка при смяна на профилната снимка. Опитайте отново.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async deleteProfilePicture(req, res) {
    if (req.isAuthenticated()) {
      try {
        const user = await User.getForeignUserById(req.user.userId);
        await user.deleteProfilePicture();

        req.logout((err) => {
          if (err) {
            console.error("Error during logout:", err);
            return res.status(500).render("error-message", {
              errorMessage:
                "Грешка при обновяване на сесията. Моля, опитайте отново.",
            });
          }

          req.login(user, (err) => {
            if (err) {
              console.error("Error during re-login:", err);
              return res.status(500).render("error-message", {
                errorMessage: "Грешка при влизане след смяна на профилната снимка.",
              });
            }
            res.redirect("/account/" + req.user.userId);
          });
        });
      } catch (err) {
        console.error("Error deleting profile picture:", err);
        res.status(500).render("error-message", {
          errorMessage: "Грешка при изтриване на профилната снимка. Опитайте отново.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static logout(req, res) {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  }
}

export default UserController;
