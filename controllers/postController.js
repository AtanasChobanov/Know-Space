import {
  createPost,
  searchPosts,
  getPost,
  updatePost,
  deletePost,
} from "../models/postModel.js";
import { isUserMemberOfChannel } from "../models/channelModel.js";

export async function getNewPostPage(req, res) {
  if (req.isAuthenticated()) {
    try {
      // Проверка дали потребителят е член на канала
      const isMember = await isUserMemberOfChannel(
        req.user.user_id,
        req.params.channel_id
      );

      if (!(isMember || req.user.user_type === "Администратор")) {
        return res.status(403).render("error-message.ejs", {
          errorMessage: "Не си член на този канал.",
        });
      }

      res.render("new-post.ejs", {
        channel_id: req.params.channel_id,
      });
    } catch (err) {
      res
        .status(404)
        .render("error-message.ejs", { errorMessage: "Каналът не съществува" });
    }
  } else {
    res.redirect("/login");
  }
}

export async function createNewPostController(req, res) {
  if (req.isAuthenticated()) {
    try {
      await createPost(
        req.body.title,
        req.body.content,
        req.user.user_id,
        req.params.channel_id
      );

      res.redirect("/view/" + req.params.channel_id);
    } catch (err) {
      res
        .status(500)
        .render("error-message.ejs", {
          errorMessage: "Грешка при създаване на пост.",
        });
    }
  } else {
    res.redirect("/login");
  }
}

export async function showSearchedPosts(req, res) {
  if (req.isAuthenticated()) {
    try {
      const posts = await searchPosts(req.body.searchedItem);
      res.render("search-post-result.ejs", { posts });
    } catch (err) {
      res.status(500).render("error-message.ejs", { errorMessage: err });
    }
  } else {
    res.redirect("/login");
  }
}

export async function getEditPostPage(req, res) {
  if (req.isAuthenticated()) {
    try {
      // Намиране на поста
      const post = await getPost(req.params.post_id);

      // Проверка дали потребителят има право да редактира
      if (
        req.user.user_id === post.author_id ||
        req.user.user_type === "Администратор"
      ) {
        return res.render("edit-post.ejs", {
          post,
          channel_id: req.params.channel_id,
        });
      } else {
        return res.redirect("/");
      }
    } catch (err) {
      res.status(500).render("error-message.ejs", {
        errorMessage: "Грешка при зареждане на формата за редактиране.",
      });
    }
  } else {
    res.redirect("/login");
  }
}

export async function updatePostController(req, res) {
  if (req.isAuthenticated()) {
    try {
      await updatePost(req.params.post_id, req.body.title, req.body.content);
      res.redirect(`/view/${req.params.channel_id}`);
    } catch (err) {
      res
        .status(500)
        .render("error-message.ejs", {
          errorMessage: "Грешка при обновяване на пост.",
        });
    }
  } else {
    res.redirect("/login");
  }
}

export async function getDeletePostPage(req, res) {
  if (req.isAuthenticated()) {
    try {
      // Намираме поста
      const post = await getPost(req.params.post_id);

      // Проверяваме дали потребителят има право да го изтрие
      if (
        req.user.user_id === post.author_id ||
        req.user.user_type === "Администратор"
      ) {
        return res.render("delete-post.ejs", {
          post,
          channel_id: req.params.channel_id,
        });
      } else {
        return res.redirect("/");
      }
    } catch (err) {
      res.status(500).render("error-message.ejs", {
        errorMessage: "Грешка при зареждане на формата за изтриване.",
      });
    }
  } else {
    res.redirect("/login");
  }
}

export async function deletePostController(req, res) {
  if (req.isAuthenticated()) {
    try {
      await deletePost(req.params.post_id);
      res.redirect(`/view/${req.params.channel_id}`);
    } catch (err) {
      res
        .status(500)
        .render("error-message.ejs", {
          errorMessage: "Грешка при изтриване на пост.",
        });
    }
  } else {
    res.redirect("/login");
  }
}
