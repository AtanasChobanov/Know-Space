import {
  createNewUser,
  getUserByEmail,
  updateUser,
  checkPassword,
  updatePassword,
  getForeignUserById,
  getUserPosts,
} from "../models/userModel.js";

export function getRegisterPage(req, res) {
  res.render("register.ejs");
}

export function getLoginPage(req, res) {
  res.render("login.ejs");
}

export async function registerUser(req, res) {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const userType = req.body.type;

  try {
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      res.render("register.ejs", {
        errorMessage: "Имейлът е вече регистриран. Пробвайте да влезете.",
      });
    } else if (password === "google") {
      res.render("register.ejs", {
        errorMessage: "Невалидна парола.",
      });
    } else {
      const user = await createNewUser(
        email,
        username,
        password,
        userType,
        null
      );

      req.login(user, (err) => {
        if (err) {
          console.error("Error during login:", err);
        }
        res.redirect("/");
      });
    }
  } catch (err) {
    res.render("error-message.ejs", { errorMessage: err });
  }
}

export async function getAccount(req, res) {
  if (req.isAuthenticated()) {
    const userId = req.params.user_id;

    try {
      // Вземаме информацията за потребителя
      const account = await getForeignUserById(userId);
      if (!account) {
        return res.status(404).render("error-message.ejs", {
          errorMessage: "User not found",
        });
      }

      // Вземаме постовете на потребителя
      const posts = await getUserPosts(userId);

      // Рендираме профила
      res.render("profile.ejs", { account, posts });
    } catch (err) {
      console.error("Error fetching profile:", err.stack);
      res.status(500).render("error-message.ejs", {
        errorMessage: "Error fetching profile",
      });
    }
  } else {
    res.redirect("/login");
  }
}

export async function getEditProfilePage(req, res) {
  if (req.isAuthenticated()) {
    res.render("edit-profile.ejs");
  } else {
    res.redirect("/login");
  }
}

export async function updateProfile(req, res) {
  if (req.isAuthenticated()) {
    try {
      const username = req.body.username;
      const bio = req.body.bio;

      const updatedUser = await updateUser(username, bio, req.user.user_id);

      // Пренасочване след успешна смяна на паролата
      req.logout((err) => {
        if (err) {
          console.error("Error during logout:", err);
          return res.status(500).render("error-message.ejs", {
            errorMessage:
              "Грешка при обновяване на сесията. Моля, опитайте отново.",
          });
        }

        // Влизане отново с обновената информация
        req.login(updatedUser, (err) => {
          if (err) {
            console.error("Error during re-login:", err);
            return res.status(500).render("error-message.ejs", {
              errorMessage: "Грешка при влизане след редактиране на профила.",
            });
          }

          res.redirect("/account/" + req.user.user_id);
        });
      });
    } catch (err) {
      console.log("Error updating profile : ", err);
      res.status(500).render("error-message.ejs", {
        errorMessage: "Неуспешно актуализиран на профила.",
      });
    }
  } else {
    res.redirect("/login");
  }
}

export async function changePassword(req, res) {
  if (req.isAuthenticated()) {
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;

    try {
      // Проверка дали новата парола и потвърждението съвпадат
      if (newPassword !== confirmPassword || newPassword === "google") {
        return res.render("edit-profile.ejs", {
          errorMessage: "Невалидна нова парола."
        });
      }

      // Проверка дали старата парола е правилна
      const isMatch = await checkPassword(req.user.user_id, oldPassword);
      if (!isMatch) {
        return res.render("edit-profile.ejs", {
          errorMessage: "Старата парола не е правилна.",
        });
      }

      // Актуализиране на паролата
      const updatedUser = await updatePassword(req.user.user_id, newPassword);

      // Пренасочване след успешна смяна на паролата
      req.logout((err) => {
        if (err) {
          console.error("Error during logout:", err);
          return res.status(500).render("error-message.ejs", {
            errorMessage:
              "Грешка при обновяване на сесията. Моля, опитайте отново.",
          });
        }

        // Влизане отново с обновената информация
        req.login(updatedUser, (err) => {
          if (err) {
            console.error("Error during re-login:", err);
            return res.status(500).render("error-message.ejs", {
              errorMessage: "Грешка при влизане след смяна на паролата.",
            });
          }

          res.redirect("/account/" + req.user.user_id);
        });
      });
    } catch (err) {
      console.error("Error changing password:", err);
      res.status(500).render("error-message.ejs", {
        errorMessage: "Грешка при смяната на паролата. Опитайте отново.",
      });
    }
  } else {
    res.redirect("/login");
  }
}

// Контролер за logout
export function logoutUser(req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
}
