import Post from "../models/postModel.js";
import Channel from "../models/channelModel.js";
import Vote from "../models/voteModel.js";
import User from "../models/userModel.js";

class PostController {
  static async getFeed(req, res) {
    if (req.isAuthenticated()) {
      try {
        const posts = await Post.getFromUserChannels(req.user.userId);

        if (posts.length === 0) {
          return res.redirect("/channels");
        }
        res.render("feed", { posts });
      } catch (err) {
        res.status(500).render("error-message", {
          errorMessage: "Грешка при зареждане на публикациите.",
        });
      }
    } else {
      const userCount = await User.getTotalUsers();
      res.render("home", { userCount });
    }
  }

  static async getNewPostPage(req, res) {
    if (req.isAuthenticated()) {
      try {
        const channel = await Channel.getById(req.params.channelId);
        const isMember = await channel.isUserMember(req.user.userId);

        if (!(isMember || req.user.userType === "Администратор")) {
          return res.status(403).render("error-message", {
            errorMessage: "Не си член на този канал.",
          });
        }

        res.render("new-post", {
          channelId: channel.channelId,
        });
      } catch (err) {
        res.status(404).render("error-message", {
          errorMessage: "Каналът не съществува",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async create(req, res) {
    if (req.isAuthenticated()) {
      try {
        await Post.create(
          req.body.title,
          req.body.content,
          req.user.userId,
          req.params.channelId,
          req.uploadedFiles,
        );

        res.redirect(`/view/${req.params.channelId}`);
      } catch (err) {
        console.error(err);
        res.status(500).render("error-message", {
          errorMessage: "Грешка при създаване на пост.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async vote(req, res) {
    try {
      const voteType = req.body.voteType;
      if (!Vote.VALID_VOTE_TYPES.includes(voteType)) {
        return res.status(400).json({ error: "Invalid vote type" });
      }
      const post = await Post.getById(req.params.postId);
      const result = await post.vote(req.user.userId, voteType);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: "Error processing vote" });
    }
  }

  static async getPostVotes(req, res) {
    try {
      const post = await Post.getById(req.params.postId);
      const votes = await post.getVotes(req.user.userId);
      res.json(votes);
    } catch (err) {
      res.status(500).json({ error: "Error fetching votes" });
    }
  }

  static async showSearchedPosts(req, res) {
    if (req.isAuthenticated()) {
      try {
        let posts = await Post.search(
          req.body.searchedItem,
          req.params.channelId
        );
        // Use Wikipedia API
        if (posts.length === 0) {
          posts = await Post.searchWikipedia(req.body.searchedItem);
        }
        const channel = await Channel.getById(req.params.channelId);
        res.render("search-post-result", {
          posts,
          channel,
        });
      } catch (err) {
        res.status(500).render("error-message", { errorMessage: err });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async getEditPostPage(req, res) {
    if (req.isAuthenticated()) {
      try {
        const post = await Post.getById(req.params.postId);
        await post.getFiles();

        if (
          req.user.userId === post.authorId ||
          req.user.userType === "Администратор"
        ) {
          return res.render("edit-post", {
            post,
            channelId: req.params.channelId,
          });
        } else {
          return res.redirect("/");
        }
      } catch (err) {
        res.status(500).render("error-message", {
          errorMessage: "Грешка при зареждане на формата за редактиране.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async update(req, res) {
    if (req.isAuthenticated()) {
      try {
        const post = await Post.getById(req.params.postId);
        if (
          req.user.userId === post.authorId ||
          req.user.userType === "Администратор"
        ) {
          await post.update(
            req.body.title,
            req.body.content,
            req.body.deletedFiles,
            req.uploadedFiles,
          );
          res.redirect(`/view/${req.params.channelId}`);
        } else {
          return res.redirect("/");
        }
      } catch (err) {
        res.status(500).render("error-message", {
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
          return res.render("delete-post", {
            post,
            channelId: req.params.channelId,
          });
        } else {
          return res.redirect("/");
        }
      } catch (err) {
        res.status(500).render("error-message", {
          errorMessage: "Грешка при зареждане на формата за изтриване.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async delete(req, res) {
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
        res.status(500).render("error-message", {
          errorMessage: "Грешка при изтриване на пост.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }
}

export default PostController;
