import express from "express";
import bodyParser from "body-parser";
import methodOverride from "method-override";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import { Strategy } from "passport-local";
import env from "dotenv";

const app = express();
const port = process.env.PORT || 3000;
const saltRounds = 10;
env.config();

// Създаване на масив с имена на профилни снимки
const defaultAvatars = ["default-avatar-1.jpg", "default-avatar-2.jpg", "default-avatar-3.jpg", "default-avatar-4.jpg"];

// Initialize Cookies and Sessions middlewares
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Middlewares
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(methodOverride("_method"));


// Middleware за глобални данни
app.use((req, res, next) => {
  if (req.user) {
    // Ако потребителят е логнат, запазваме целия обект user
    res.locals.user = req.user;
  } else {
    // Ако потребителят не е логнат, задаваме null
    res.locals.user = null;
  }
  next();
});

// Connecting to PostgreSQL server
const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});
db.connect();

// READING channels to display
async function readChannels(user_id) {
  const query = `
    SELECT ch.channel_id, ch.name, ch.date_of_creation, ch.admin_id, u.username AS admin, u.profile_picture AS admin_picture, COUNT(moc.user_id) AS members_count
    FROM channels ch
    JOIN users u ON ch.admin_id = u.user_id
    LEFT JOIN members_of_channels moc ON ch.channel_id = moc.channel_id
    WHERE ch.channel_id IN (
      SELECT channel_id 
      FROM members_of_channels 
      WHERE user_id = $1
    )
    GROUP BY ch.channel_id, u.username, u.profile_picture
    ORDER BY ch.date_of_creation DESC;
  `;

  const result = await db.query(query, [user_id]);

  let channels = [];
  result.rows.forEach((channel) => {
    channel.date_of_creation = new Date(
      channel.date_of_creation
    ).toDateString();
    channels.push(channel);
  });

  console.log(channels);
  return channels;
}

// READING a specific channel to modify
async function readChannel(id) {
  const result = await db.query(
    "SELECT * FROM channels WHERE channel_id = $1;",
    [id]
  );

  console.log(result.rows);
  let channel = result.rows[0];
  return channel;
}

// READING posts from a channel to display
async function readPosts(channel_id) {
  const result = await db.query(
    "SELECT ch.name, post_id, title, content, author_id, u.username AS author, p.date_of_creation, date_of_last_edit " +
      "FROM posts p " +
      "JOIN channels ch " +
      "ON ch.channel_id = p.channel_id " +
      "JOIN users u " +
      "ON p.author_id = u.user_id " +
      "WHERE ch.channel_id = $1 " +
      "ORDER BY date_of_creation DESC;",
    [channel_id]
  );

  let posts = [];
  result.rows.forEach((post) => {
    posts.push(post);
  });

  return posts;
}

// READING a specific post to modify
async function findPost(post_id) {
  const result = await db.query("SELECT * FROM posts WHERE post_id = $1;", [
    post_id,
  ]);

  let post = result.rows[0];
  return post;
}

// READING search result to display channels
async function searchChannels(searchedItem) {
  const result = await db.query(
    "SELECT channel_id, ch.name, date_of_creation, admin_id, u.profile_picture AS admin_picture, " +
      "u.username AS admin FROM channels ch " +
      "JOIN users u " +
      "ON ch.admin_id = u.user_id WHERE LOWER(ch.name) LIKE '%' || $1 || '%';",
    [searchedItem.toLowerCase()]
  );

  let channels = [];
  result.rows.forEach((channel) => {
    channel.date_of_creation = new Date(
      channel.date_of_creation
    ).toDateString();
    channels.push(channel);
  });

  console.log("Searched channels result count: " + channels.length);
  return channels;
}

// READING search result to display channels
async function searchPosts(searchedItem) {
  const result = await db.query(
    "SELECT post_id, p.title, date_of_creation, date_of_last_edit, author_id, channel_id, " +
      "u.username AS author FROM posts p " +
      "JOIN users u " +
      "ON p.author_id = u.user_id WHERE LOWER(p.title) LIKE '%' || $1 || '%';",
    [searchedItem.toLowerCase()]
  );

  let posts = [];
  result.rows.forEach((post) => {
    posts.push(post);
  });

  console.log("Searched posts result count: " + posts.length);
  return posts;
}

async function isUserMemberOfChannel(user_id, channel_id) {
  const query = `
    SELECT 1
    FROM members_of_channels
    WHERE user_id = $1 AND channel_id = $2;
  `;
  const result = await db.query(query, [user_id, channel_id]);
  return result.rowCount > 0; // Ако има ред, значи потребителят е член
}

// Функция за добавяне на потребител към канал
async function joinChannel(user_id, channel_id) {
  try {
    await db.query(
      "INSERT INTO members_of_channels (user_id, channel_id) VALUES ($1, $2);",
      [user_id, channel_id]
    );
  } catch (err) {
    console.log("Error adding user to channel: " + err);
    throw err;
  }
}

// Home route - veiws all channels Checked
app.get("/", async (req, res) => {
  console.log(req.user);
  if (req.isAuthenticated()) {
    try {
      const channels = await readChannels(req.user.user_id);
      res.render("view-channels.ejs", { channels });
    } catch (err) {
      console.log("Error executing query: " + err);
      res.status(500).render("error-message.ejs", {
        errorMessage: "Error loading channels.",
      });
    }
  } else {
    res.render("home.ejs");
  }
});

// Render the login form Checked
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

// Register new user Checked
app.post("/register", async (req, res) => {
  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;
  const userType = req.body.type;

  // Избиране на случайна снимка от масива
  const randomAvatar =
    defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

  try {
    const checkResult = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (checkResult.rows.length > 0) {
      res.render("error-message.ejs", {
        errorMessage: "Имейлът е вече регистриран. Пробвай да влезеш.",
      });
    } else {
      // Хеширане на паролата и записване в базата данни
      bcrypt.hash(password, saltRounds, async (err, hash) => {
        if (err) {
          console.error("Error hashing password:", err);
          res.status(500).render("error-message.ejs", { errorMessage: err });
        } else {
          console.log("Hashed Password:", hash);

          // Вмъкване на потребител с профилна снимка по подразбиране
          const result = await db.query(
            "INSERT INTO users (email, password, username, user_type, profile_picture) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [email, hash, username, userType, randomAvatar]
          );

          const user = result.rows[0];
          req.login(user, (err) => {
            console.log(err);
            res.redirect("/"); // Пренасочване след успешна регистрация
          });
        }
      });
    }
  } catch (err) {
    console.log(err);
    res.render("error-message.ejs", { errorMessage: err });
  }
});

// Маршрут за показване на формата за редактиране на профил
app.get("/edit-profile", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("edit-profile.ejs");
  } else {
    res.redirect("/login");
  }
});

// Маршрут за обработка на формата за редактиране
app.post("/edit-profile", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const username = req.body.username;
      const bio = req.body.bio;

      await db.query("UPDATE users SET username = $1, bio = $2 WHERE user_id = $3;", [username, bio, req.user.user_id]);

      const result = await db.query(
        "SELECT * FROM users WHERE user_id = $1;",
        [req.user.user_id]
      );

      const updatedUser = result.rows[0];

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
      console.log("Error updating profile : ", err);
      res.status(500).render("error-message.ejs", {
        errorMessage: "Неуспешно актуализиран на профила.",
      });
    }
  } else {
    res.redirect("/login");
  }
});

// UPDATE user's password
app.post("/change-password", async (req, res) => {
  if (req.isAuthenticated()) {
    const oldPassword = req.body.oldPassword;
    const newPassword = req.body.newPassword;
    const confirmPassword = req.body.confirmPassword;

    try {
      // Проверка дали newPassword и confirmPassword съвпадат
      if (newPassword !== confirmPassword) {
        return res.render("edit-profile.ejs", {
          errorMessage: "Новите пароли не съвпадат.",
          hidden: false,
        });
      }

      // Вземане на текущата парола от базата данни
      const result = await db.query(
        "SELECT password FROM users WHERE user_id = $1",
        [req.user.user_id]
      );
      const storedHashedPassword = result.rows[0].password;

      // Проверка дали старата парола съвпада
      const isMatch = await bcrypt.compare(oldPassword, storedHashedPassword);
      if (!isMatch) {
        return res.render("edit-profile.ejs", {
          errorMessage: "Старата парола не е правилна.",
          hidden: false,
        });
      }

      // Хеширане на новата парола
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds, async (err, hash) => {
          if (err) {
            console.error("Error hashing password:", err);
            res.status(500).render("error-message.ejs", { errorMessage: err });
          } else {
            console.log("Hashed Password:", hash);

            await db.query("UPDATE users SET password = $1 WHERE user_id = $2;", [hash, req.user.user_id]);

            // Актуализация на базата данни
            const updatedUserResult = await db.query(
              "SELECT * FROM users WHERE user_id = $1;",
              [req.user.user_id]
            );

            const updatedUser = updatedUserResult.rows[0];

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
          }
      });
    } catch (err) {
      console.error("Error changing password:", err);
      res.status(500).render("error-message.ejs", {
        errorMessage: "Грешка при смяната на паролата.",
      });
    }
  } else {
    res.redirect("/login");
  }
});


// READ an account Checked
app.get("/account/:user_id", async (req, res) => {
  if (req.isAuthenticated()) {
    const userId = req.params.user_id;

    try {
      const userResult = await db.query(
        "SELECT user_id, username, user_type, bio, profile_picture FROM users WHERE user_id = $1;",
        [userId]
      );
      const account = userResult.rows[0];
      console.log(account);

      if (!account) {
        res
          .status(404)
          .render("error-message.ejs", { errorMessage: "User not found" });
      }

      const postsResult = await db.query(
        "SELECT post_id, title, content, date_of_creation, date_of_last_edit FROM public.posts WHERE author_id = $1 ORDER BY date_of_creation DESC;",
        [userId]
      );
      const posts = postsResult.rows;
      console.log(posts);

      res.render("profile.ejs", { account, posts });
    } catch (err) {
      console.error("Error executing query:", err.stack);
      res.status(500).render("error-message.ejs", {
        errorMessage: "Error fetching profile",
      });
    }
  } else {
    res.redirect("/login");
  }
});

// READ all posts in a channel Checked
app.get("/view/:channel_id", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const isMember = await isUserMemberOfChannel(
        req.user.user_id,
        req.params.channel_id
      );

      if (!isMember) {
        return res.status(403).render("error-message.ejs", {
          errorMessage: "You are not a member of this channel.",
        });
      }

      const channel = await readChannel(req.params.channel_id);
      const posts = await readPosts(req.params.channel_id);

      res.render("view-posts.ejs", {
        posts: posts,
        channel: channel,
      });
    } catch (err) {
      console.log("Error executing query: " + err);
      res
        .status(404)
        .render("error-message.ejs", { errorMessage: err.message });
    }
  } else {
    res.redirect("/login");
  }
});

// READ form for creating new channel Checked
app.get("/new-channel", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("new-channel.ejs");
  } else {
    res.redirect("/login");
  }
});

// READ form for creating a new post in a channel Checked
app.get("/:channel_id/new-post", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      // Проверка дали потребителят е член на канала
      const isMember = await isUserMemberOfChannel(
        req.user.user_id,
        req.params.channel_id
      );

      if (!isMember) {
        return res.status(403).render("error-message.ejs", {
          errorMessage: "You are not a member of this channel.",
        });
      }

      const channel = await readChannel(req.params.channel_id);
      res.render("new-post.ejs", {
        channel_id: channel.channel_id,
      });
    } catch (err) {
      console.log("Error executing query: " + err);
      res
        .status(404)
        .render("error-message.ejs", { errorMessage: "Channel not found" });
    }
  } else {
    res.redirect("/login");
  }
});

// CREATE member of a channel
app.post("/join-channel/:channel_id", async (req, res) => {
  if (req.isAuthenticated()) {
    const userId = req.user.user_id;
    const channelId = req.params.channel_id;

    try {
      // Добавяме потребителя като член на канала
      await joinChannel(userId, channelId);

      // Пренасочваме към канала
      res.redirect(`/view/${channelId}`);
    } catch (err) {
      console.log("Error executing query: " + err);
      res.status(500).render("error-message.ejs", {
        errorMessage: "Не може да се присъединиш към канала.",
      });
    }
  } else {
    res.redirect("/login");
  }
});

// DELETE member of channel
app.post("/leave-channel/:channel_id", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      // Изтриваме потребителя от таблицата members_of_channels
      await db.query(
        "DELETE FROM members_of_channels WHERE user_id = $1 AND channel_id = $2",
        [req.user.user_id, req.params.channel_id]
      );

      console.log(
        `User ${req.user.username} left the channel ${req.params.channel_id}`
      );

      // Пренасочваме към началната страница или към страницата с канали
      res.redirect("/");
    } catch (err) {
      console.log("Error executing query: " + err);
      res.status(500).render("error-message.ejs", {
        errorMessage: "Error leaving the channel",
      });
    }
  } else {
    res.redirect("/login");
  }
});

// READ searched channel Checked
app.post("/search-channel", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      // Получаваме всички канали според търсенето
      const channels = await searchChannels(req.body.searchedItem);

      // За всеки канал проверяваме дали потребителят е член
      for (let channel of channels) {
        const result = await db.query(
          "SELECT 1 FROM members_of_channels WHERE user_id = $1 AND channel_id = $2",
          [req.user.user_id, channel.channel_id]
        );
        // Добавяме поле is_member за всеки канал
        channel.is_member = result.rows.length > 0;
      }

      // Изпращаме резултата към фронтента с новото поле is_member
      res.render("search-channel-result.ejs", { channels });
    } catch (err) {
      console.log("Error executing query: " + err);
      res
        .status(500)
        .render("error-message.ejs", { errorMessage: "Error executing query" });
    }
  } else {
    res.redirect("/login");
  }
});

// READ searched post Checked
app.post("/search-post", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const posts = await searchPosts(req.body.searchedItem);
      res.render("search-post-result.ejs", { posts });
    } catch (err) {
      console.log("Error executing query: " + err);
      res
        .status(500)
        .render("error-message.ejs", { errorMessage: "Error executing query" });
    }
  } else {
    res.redirect("/login");
  }
});

// CREATE new channel Checked
app.post("/create-channel", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      // Създаване на канала
      const insertChannelQuery = `
        INSERT INTO channels (name, admin_id) 
        VALUES ($1, $2) 
        RETURNING channel_id;
      `;
      const channelResult = await db.query(insertChannelQuery, [
        req.body.name,
        req.user.user_id,
      ]);

      const newChannelId = channelResult.rows[0].channel_id;

      // Добавяне на създателя като член на канала
      const insertMemberQuery = `
        INSERT INTO members_of_channels (user_id, channel_id) 
        VALUES ($1, $2);
      `;
      await db.query(insertMemberQuery, [req.user.user_id, newChannelId]);

      console.log(`New channel created with ID: ${newChannelId}`);
      res.redirect("/");
    } catch (err) {
      console.log("Error executing query: " + err);
      res.render("new-channel.ejs", {
        name: req.body.name,
        errorMessage: "Това име на канал вече съществува!",
      });
    }
  } else {
    res.redirect("/login");
  }
});

// CREATE new post in a channel Checked
app.post("/:channel_id/create-post", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      await db.query(
        "INSERT INTO posts (title, content, author_id, channel_id) VALUES ($1, $2, $3, $4);",
        [
          req.body.title,
          req.body.content,
          req.user.user_id,
          req.params.channel_id,
        ]
      );
      console.log(`New post published.`);
      res.redirect("/view/" + req.params.channel_id);
    } catch (err) {
      console.log("Error executing query: " + err);
      res
        .status(500)
        .render("error-message.ejs", { errorMessage: "Error publishing post" });
    }
  } else {
    res.redirect("/login");
  }
});

// READ form for updating a channel Checked
app.get("/:channel_id/edit", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const channel = await readChannel(req.params.channel_id);

      if (req.user.user_id === channel.admin_id) {
        res.render("edit-channel.ejs", {
          channel: channel,
        });
      } else {
        // Обмсли за връщане на някаква грешка или просто връщане в заглавната станица
        res.redirect("/");
      }
    } catch (err) {
      res
        .status(404)
        .render("error-message.ejs", { errorMessage: "Channel not found" });
    }
  } else {
    res.redirect("/login");
  }
});

// READ form for updating a post in a channel Checked
app.get("/:channel_id/edit/:post_id", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const post = await findPost(req.params.post_id);

      if (req.user.user_id === post.author_id) {
        res.render("edit-post.ejs", {
          post: post,
          channel_id: req.params.channel_id,
        });
      } else {
        // Обмсли за връщане на някаква грешка или просто връщане в заглавната станица
        res.redirect("/");
      }
    } catch (err) {
      console.log("Error executing query: " + err.stack);
      res.status(404).render("error-message.ejs", {
        errorMessage: `Post in channel ${post.name} not found`,
      });
    }
  } else {
    res.redirect("/login");
  }
});

// UPDATE a channel Checked
app.patch("/:channel_id/edit", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      await db.query("UPDATE channels SET name = $1 WHERE channel_id = $2;", [
        req.body.name,
        req.params.channel_id,
      ]);
      console.log(`Updated channel with id: ${req.params.channel_id}.`);
      res.redirect("/");
    } catch (err) {
      console.log("Error executing query: " + err.stack);
      res.status(500).render("error-message.ejs", {
        errorMessage: "Error updating channel",
      });
    }
  } else {
    res.redirect("/login");
  }
});

// UPDATE a post in a channel Checked
app.patch("/:channel_id/edit-post/:post_id", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      await db.query(
        "UPDATE posts SET title = $1, content = $2, date_of_last_edit = CURRENT_TIMESTAMP WHERE post_id = $3;",
        [req.body.title, req.body.content, req.params.post_id]
      );
      console.log(`Updated post with id: ${req.params.post_id}.`);
      res.redirect("/view/" + req.params.channel_id);
    } catch (err) {
      console.log("Error executing query: " + err.stack);
      res
        .status(500)
        .render("error-message.ejs", { errorMessage: "Error updating post" });
    }
  } else {
    res.redirect("/login");
  }
});

// READ form for deleting channel Checked
app.get("/:channel_id/delete", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const channel = await readChannel(req.params.channel_id);

      if (req.user.user_id === channel.admin_id) {
        res.render("delete-channel.ejs", {
          channel: channel,
        });
      } else {
        // Обмсли за връщане на някаква грешка или просто връщане в заглавната станица
        res.redirect("/");
      }
    } catch (err) {
      res
        .status(404)
        .render("error-message.ejs", { errorMessage: "Channel not found" });
    }
  } else {
    res.redirect("/login");
  }
});

// READ from for deleting a post in a channel Checked
app.get("/:channel_id/delete-post/:post_id", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const post = await findPost(req.params.post_id);

      if (req.user.user_id === post.author_id) {
        res.render("delete-post.ejs", {
          post: post,
          channel_id: req.params.channel_id,
        });
      } else {
        // Обмсли за връщане на някаква грешка или просто връщане в заглавната станица
        res.redirect("/");
      }
    } catch (err) {
      console.log("Error executing query: " + err.stack);
      res.status(404).render("error-message.ejs", {
        errorMessage: `Post in channel ${post.name} not found`,
      });
    }
  } else {
    res.redirect("/login");
  }
});

// DELETE a channel Checked
app.delete("/:channel_id/delete", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      await db.query("DELETE FROM channels WHERE channel_id = $1;", [
        req.params.channel_id,
      ]);
      console.log(`Deleted channel with id: ${req.params.channel_id}.`);
      res.redirect("/");
    } catch (err) {
      console.log("Error executing query: " + err.stack);
      res.status(500).render("error-message.ejs", {
        errorMessage: "Error deleting channel",
      });
    }
  } else {
    res.redirect("/login");
  }
});

// DELETE a post in a channel Checked
app.delete("/:channel_id/delete-post/:post_id", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      await db.query("DELETE FROM posts WHERE post_id = $1;", [
        req.params.post_id,
      ]);
      console.log(`Deleted post with id: ${req.params.post_id}.`);
      res.redirect("/view/" + req.params.channel_id);
    } catch (err) {
      console.log("Error executing query: " + err.stack);
      res
        .status(500)
        .render("error-message.ejs", { errorMessage: "Error deleting post" });
    }
  } else {
    res.redirect("/login");
  }
});

// Authenticate user after login
app.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);

// Remove user's session
app.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// Define the way a user should be authenticated
passport.use(
  new Strategy(async function verify(username, password, cb) {
    try {
      const result = await db.query("SELECT * FROM users WHERE email = $1", [
        username,
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.password;

        bcrypt.compare(password, storedHashedPassword, (err, result) => {
          if (err) {
            return cb(err);
          } else {
            if (result) {
              return cb(null, user);
            } else {
              return cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found");
      }
    } catch (err) {
      return cb(err);
    }
  })
);

passport.serializeUser((user, cb) => {
  return cb(null, user);
});
passport.deserializeUser((user, cb) => {
  return cb(null, user);
});

app.listen(port, () => {
  console.log(`Listening on port http://localhost:${port}...`);
});
