import {
  getUserChannels,
  getRecentChannels,
  createNewChannel,
  isUserMemberOfChannel,
  getChannel,
  searchChannels,
  joinChannel,
  leaveChannel,
  updateChannel,
  deleteChannel,
} from "../models/channelModel.js";
import { getPostsFromChannel } from "../models/postModel.js";

export async function viewChannels(req, res) {
  if (req.isAuthenticated()) {
    try {
      const userChannels = await getUserChannels(req.user.user_id);

      if (userChannels.length === 0) {
        const recentChannels = await getRecentChannels();
        return res.render("view-channels.ejs", {
          channels: recentChannels,
          infoMessage:
            "Не сте член на нито един канал. Ето някои от най-новите канали, които можете да разгледате.",
        });
      }
      res.render("view-channels.ejs", {
        channels: userChannels,
      });
    } catch (err) {
      res.status(500).render("error-message.ejs", {
        errorMessage:
          "Възникна проблем при зареждането на каналите. Опитайте отново.",
      });
    }
  } else {
    res.render("home.ejs");
  }
}

export async function getNewChannelPage(req, res) {
  if (req.isAuthenticated()) {
    res.render("new-channel.ejs");
  } else {
    res.redirect("/login");
  }
}

export async function createChannelController(req, res) {
  if (req.isAuthenticated()) {
    try {
      // Създаваме канала и автоматично добавяме създателя като член
      await createNewChannel(req.body.name, req.user.user_id);
      res.redirect("/");
    } catch (err) {
      res.render("new-channel.ejs", {
        name: req.body.name,
        errorMessage: "Това име на канал вече съществува!",
      });
    }
  } else {
    res.redirect("/login");
  }
}

export async function viewChannelPosts(req, res) {
  if (req.isAuthenticated()) {
    try {
      // Проверка дали потребителят е член или администратор
      const isMember = await isUserMemberOfChannel(
        req.user.user_id,
        req.params.channel_id
      );
      if (!(isMember || req.user.user_type === "Администратор")) {
        return res.status(403).render("error-message.ejs", {
          errorMessage: "Не си член на този канал.",
        });
      }

      const channel = await getChannel(req.params.channel_id);
      const posts = await getPostsFromChannel(req.params.channel_id);

      // Рендиране на изгледа
      res.render("view-posts.ejs", {
        posts,
        channel,
      });
    } catch (err) {
      res.status(500).render("error-message.ejs", {
        errorMessage: "Грешка при зареждане на постовете.",
      });
    }
  } else {
    res.redirect("/login");
  }
}

export async function searchChannelsController(req, res) {
  if (req.isAuthenticated()) {
    try {
      // Намираме всички канали според ключовата дума
      const channels = await searchChannels(req.body.searchedItem);
      // Рендираме резултата
      res.render("search-channel-result.ejs", { channels });
    } catch (err) {
      res.status(500).render("error-message.ejs", {
        errorMessage: "Грешка при търсене на канал.",
      });
    }
  } else {
    res.redirect("/login");
  }
}

export async function joinChannelController(req, res) {
  if (req.isAuthenticated()) {
    const user_id = req.user.user_id;
    const channel_id = req.params.channel_id;
    try {
      // Добавяме потребителя като член на канала
      await joinChannel(user_id, channel_id);
      res.redirect(`/view/${channel_id}`);
    } catch (err) {
      res.status(500).render("error-message.ejs", {
        errorMessage: "Не може да се присъединиш към канала.",
      });
    }
  } else {
    res.redirect("/login");
  }
}

export async function leaveChannelController(req, res) {
  if (req.isAuthenticated()) {
    try {
      await leaveChannel(req.user.user_id, req.params.channel_id);
      res.redirect("/");
    } catch (err) {
      res.status(500).render("error-message.ejs", {
        errorMessage: "Не можеш да излезеш от канала.",
      });
    }
  } else {
    res.redirect("/login");
  }
}

export async function getEditChannelPage(req, res) {
  if (req.isAuthenticated()) {
    try {
      const channel = await getChannel(req.params.channel_id);
      if (req.user.user_id === channel.admin_id || req.user.user_type === "Администратор") {
        res.render("edit-channel.ejs", { channel: channel, });
      } else {
        res.redirect("/");
      }
    } catch (err) {
      res
        .status(404)
        .render("error-message.ejs", { errorMessage: "Каналът не е намерен" });
    }
  } else {
    res.redirect("/login");
  }
}

export async function updateChannelConroller(req, res) {
  if (req.isAuthenticated()) {
    try {
      await updateChannel(req.body.name, req.params.channel_id)
      res.redirect("/");
    } catch (err) {
      res.status(500).render("error-message.ejs", {
        errorMessage: "Неуспешно актуализиране на канала",
      });
    }
  } else {
    res.redirect("/login");
  }
}

export async function getDeleteChannelPage(req, res) {
  if (req.isAuthenticated()) {
    try {
      const channel = await getChannel(req.params.channel_id);

      if (req.user.user_id === channel.admin_id || req.user.user_type === "Администратор") {
        res.render("delete-channel.ejs", {
          channel: channel,
        });
      } else {
        res.redirect("/");
      }
    } catch (err) {
      res
        .status(404)
        .render("error-message.ejs", { errorMessage: "Каналът не съществува" });
    }
  } else {
    res.redirect("/login");
  }
}

export async function deleteChannelConroller(req, res) {
  if (req.isAuthenticated()) {
    try {
      await deleteChannel(req.params.channel_id)
      res.redirect("/");
    } catch (err) {
      res.status(500).render("error-message.ejs", {
        errorMessage: "Неуспешно изтриване на канала",
      });
    }
  } else {
    res.redirect("/login");
  }
}