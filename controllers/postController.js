import Post from "../models/postModel.js";
import Channel from "../models/channelModel.js";

class PostController {
  static async getNewPostPage(req, res) {
    if (req.isAuthenticated()) {
      try {
        const channel = await Channel.getById(req.params.channelId);
        const isMember = await channel.isUserMember(req.user.userId);

        if (!(isMember || req.user.userType === "Администратор")) {
          return res.status(403).render("error-message.ejs", {
            errorMessage: "Не си член на този канал.",
          });
        }

        res.render("new-post.ejs", {
          channelId: channel.channelId,
        });
      } catch (err) {
        res
          .status(404)
          .render("error-message.ejs", {
            errorMessage: "Каналът не съществува",
          });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async createController(req, res) {
    if (req.isAuthenticated()) {
      try {
        const post = await Post.create(
          req.body.title,
          req.body.content,
          req.user.userId,
          req.params.channelId
        );

        res.redirect(`/view/${req.params.channelId}`);
      } catch (err) {
        res.status(500).render("error-message.ejs", {
          errorMessage: "Грешка при създаване на пост.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async showSearchedPostsController(req, res) {
    if (req.isAuthenticated()) {
      try {
        const posts = await Post.search(req.body.searchedItem, req.params.channelId);
        res.render("search-post-result.ejs", { posts, channelId: req.params.channelId });
      } catch (err) {
        res.status(500).render("error-message.ejs", { errorMessage: err });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async getEditPostPage(req, res) {
    if (req.isAuthenticated()) {
      try {
        const post = await Post.getById(req.params.postId);

        if (
          req.user.userId === post.authorId ||
          req.user.userType === "Администратор"
        ) {
          return res.render("edit-post.ejs", {
            post,
            channelId: req.params.channelId,
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

  static async updateController(req, res) {
    if (req.isAuthenticated()) {
      try {
        const post = await Post.getById(req.params.postId);

        if (
          req.user.userId === post.authorId ||
          req.user.userType === "Администратор"
        ) {
          await post.update(req.body.title, req.body.content);
          res.redirect(`/view/${req.params.channelId}`);
        } else {
          return res.redirect("/");
        }
      } catch (err) {
        res.status(500).render("error-message.ejs", {
          errorMessage: "Грешка при обновяване на пост.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async getDeletePostPage(req, res) {
    if (req.isAuthenticated()) {
      try {
        const post = await Post.getById(req.params.postId);

        if (
          req.user.userId === post.authorId ||
          req.user.userType === "Администратор"
        ) {
          return res.render("delete-post.ejs", {
            post,
            channelId: req.params.channelId,
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

  static async deleteController(req, res) {
    if (req.isAuthenticated()) {
      try {
        const post = await Post.getById(req.params.postId);

        if (
          req.user.userId === post.authorId ||
          req.user.userType === "Администратор"
        ) {
          await post.delete();
          res.redirect(`/view/${req.params.channelId}`);
        } else {
          return res.redirect("/");
        }
      } catch (err) {
        res.status(500).render("error-message.ejs", {
          errorMessage: "Грешка при изтриване на пост.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }
}

export default PostController;
