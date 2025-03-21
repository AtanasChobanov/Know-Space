import Channel from "../models/channelModel.js";
import Post from "../models/postModel.js";

class ChannelController {
  static async viewChannels(req, res) {
    if (req.isAuthenticated()) {
      try {
        const userChannels = await Channel.getUserChannels(req.user.userId);

        if (userChannels.length === 0) {
          return res.redirect("/explore");
        }
        res.render("view-channels", {
          channels: userChannels,
        });
      } catch (err) {
        res.status(500).render("error-message", {
          errorMessage: "Грешка при зареждане на каналите.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async exploreChannelsController(req, res) {
    if (req.isAuthenticated()) {
      try {
        const recentChannels = await Channel.getRecentChannels(req.user.userId);
        return res.render("explore", {
          channels: recentChannels,
        });
      } catch (err) {
        res.status(500).render("error-message", {
          errorMessage: "Грешка при зареждане на каналите.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static getNewChannelPage(req, res) {
    if (req.isAuthenticated()) {
      res.render("new-channel");
    } else {
      res.redirect("/login");
    }
  }

  static async createController(req, res) {
    if (req.isAuthenticated()) {
      try {
        await Channel.create(req.body.name, req.user.userId);
        res.redirect("/");
      } catch (err) {
        res.render("new-channel", {
          name: req.body.name,
          errorMessage: "Това име на канал вече съществува!",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async viewChannelPosts(req, res) {
    if (req.isAuthenticated()) {
      try {
        const channel = await Channel.getById(req.params.channelId);
        const isMember = await channel.isUserMember(req.user.userId);

        if (!(isMember || req.user.userType === "Администратор")) {
          return res.status(403).render("error-message", {
            errorMessage: "Не си член на този канал.",
          });
        }

        const posts = await Post.getFromChannel(channel.channelId);

        res.render("view-posts", {
          posts,
          channel,
        });
      } catch (err) {
        res.status(500).render("error-message", {
          errorMessage: "Грешка при зареждане на постовете.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async showSearchedChannelsController(req, res) {
    if (req.isAuthenticated()) {
      try {
        const channels = await Channel.searchChannels(
          req.body.searchedItem,
          req.user.userId
        );
        res.render("search-channel-result", { channels });
      } catch (err) {
        res.status(500).render("error-message", {
          errorMessage: "Грешка при търсене на канал.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async joinChannel(req, res) {
    if (req.isAuthenticated()) {
      try {
        const channel = await Channel.getById(req.params.channelId);
        await channel.addMember(req.user.userId);
        res.redirect(`/view/${channel.channelId}`);
      } catch (err) {
        res.status(500).render("error-message", {
          errorMessage: "Не може да се присъединиш към канала.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async leaveChannel(req, res) {
    if (req.isAuthenticated()) {
      try {
        const channel = await Channel.getById(req.params.channelId);
        await channel.removeMember(req.user.userId);
        res.redirect("/");
      } catch (err) {
        res.status(500).render("error-message", {
          errorMessage: "Не можеш да излезеш от канала.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async getEditChannelPage(req, res) {
    if (req.isAuthenticated()) {
      try {
        const channel = await Channel.getById(req.params.channelId);

        if (
          req.user.userId === channel.adminId ||
          req.user.userType === "Администратор"
        ) {
          res.render("edit-channel", { channel });
        } else {
          res.redirect("/");
        }
      } catch (err) {
        res.status(404).render("error-message", {
          errorMessage: "Каналът не е намерен.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async updateController(req, res) {
    if (req.isAuthenticated()) {
      try {
        const channel = await Channel.getById(req.params.channelId);

        if (
          req.user.userId === channel.adminId ||
          req.user.userType === "Администратор"
        ) {
          await channel.update(req.body.name);
        }
        res.redirect("/");
      } catch (err) {
        res.status(500).render("error-message", {
          errorMessage: "Неуспешно актуализиране на канала.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async getDeleteChannelPage(req, res) {
    if (req.isAuthenticated()) {
      try {
        const channel = await Channel.getById(req.params.channelId);

        if (
          req.user.userId === channel.adminId ||
          req.user.userType === "Администратор"
        ) {
          res.render("delete-channel", { channel });
        } else {
          res.redirect("/");
        }
      } catch (err) {
        res.status(404).render("error-message", {
          errorMessage: "Каналът не съществува.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }

  static async deleteController(req, res) {
    if (req.isAuthenticated()) {
      try {
        const channel = await Channel.getById(req.params.channelId);

        if (
          req.user.userId === channel.adminId ||
          req.user.userType === "Администратор"
        ) {
          await channel.delete();
        }
        res.redirect("/");
      } catch (err) {
        res.status(500).render("error-message", {
          errorMessage: "Неуспешно изтриване на канала.",
        });
      }
    } else {
      res.redirect("/login");
    }
  }
}

export default ChannelController;
