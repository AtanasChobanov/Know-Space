import db from "../config/db.js";
import File from "./fileModel.js";

class Channel {
  constructor(channelId, name, dateOfCreation, adminId, admin = null, adminPicture = null, membersCount = 0, bannerUrl = null) {
    this.channelId = channelId;
    this.name = name;
    this.dateOfCreation = new Date(dateOfCreation).toDateString();
    this.adminId = adminId;
    this.admin = admin;
    this.adminPicture = adminPicture;
    this.membersCount = membersCount;
    this.bannerUrl = bannerUrl;
  }

  async addMember(userId) {
    try {
      await db.query(
        `INSERT INTO members_of_channels (user_id, channel_id) VALUES ($1, $2);`,
        [userId, this.channelId]
      );
    } catch (err) {
      console.error("Error adding member to channel:", err);
      throw err;
    }
  }

  async removeMember(userId) {
    try {
      await db.query(
        "DELETE FROM members_of_channels WHERE user_id = $1 AND channel_id = $2",
        [userId, this.channelId]
      );
      console.log(`User with id ${userId} left the channel with id ${this.channelId}`);
    } catch (err) {
      console.error("Error removing user from channel:", err);
      throw err;
    }
  }

  // Checks if current user is member of channel
  async isUserMember(userId) {
    try {
      const result = await db.query(
        `SELECT 1 FROM members_of_channels 
        WHERE user_id = $1 AND channel_id = $2;`,
        [userId, this.channelId]
      );
      return result.rowCount > 0; // returns true, if user is member of channel
    } catch (err) {
      console.error("Error checking channel membership:", err);
      throw err;
    }
  }

  async update(newName, banner) {
    try {
      if (banner.url !== '') {
        if (this.bannerUrl) {
          const oldBanner = new File(null, null, this.bannerUrl, "image", null);
          await oldBanner.deleteFromCloudinary();
        }
      } else {
        banner.url = this.bannerUrl; // keep the old banner if no new one is provided
      }

      await db.query("UPDATE channels SET name = $1, banner_url = $2 WHERE channel_id = $3;", [
        newName,
        banner.url,
        this.channelId,
      ]);
      console.log(`Updated channel with id: ${this.channelId}.`);
    } catch (err) {
      console.error("Error updating channel:", err);
      throw err;
    }
  }

  async delete() {
    try {
      if (this.bannerUrl) {
        const bannerFile = new File(null, null, this.bannerUrl, "image", null);
        await bannerFile.deleteFromCloudinary();
      }
      await db.query("DELETE FROM channels WHERE channel_id = $1;", [this.channelId]);
      console.log(`Deleted channel with id: ${this.channelId}.`);
    } catch (err) {
      console.error("Error deleting channel:", err);
      throw err;
    }
  }

  // READ channels that the user is in to display
  static async getUserChannels(userId) {
    try {
      const query = `
          SELECT ch.channel_id, ch.name, ch.date_of_creation, ch.admin_id, u.username AS admin, 
          u.profile_picture AS admin_picture, COUNT(moc.user_id) AS members_count, ch.banner_url
          FROM channels ch
          JOIN users u ON ch.admin_id = u.user_id
          LEFT JOIN members_of_channels moc ON ch.channel_id = moc.channel_id
          WHERE ch.channel_id IN (
            SELECT channel_id FROM members_of_channels WHERE user_id = $1
          )
          GROUP BY ch.channel_id, u.username, u.profile_picture
          ORDER BY ch.date_of_creation DESC;
          `;
      const result = await db.query(query, [userId]);

      return result.rows.map((channel) => new Channel(
        channel.channel_id,
        channel.name,
        channel.date_of_creation,
        channel.admin_id,
        channel.admin,
        channel.admin_picture,
        channel.members_count,
        channel.banner_url,
      ));
    } catch (err) {
      console.error("Error fetching user channels:", err);
      throw err;
    }
  }

  // READ recent channels when user isn't member of any channel
  static async getRecentChannels(userId, limit = 15) {
    try {
      const query = `
          SELECT ch.channel_id, ch.name, ch.date_of_creation, ch.admin_id, u.username AS admin, 
          u.profile_picture AS admin_picture, COUNT(moc.user_id) AS members_count, ch.banner_url
          FROM channels ch
          JOIN users u ON ch.admin_id = u.user_id
          LEFT JOIN members_of_channels moc ON ch.channel_id = moc.channel_id
          GROUP BY ch.channel_id, u.username, u.profile_picture
          ORDER BY ch.date_of_creation DESC
          LIMIT $1
          `;
      const result = await db.query(query, [limit]);

      const channels = await Promise.all(result.rows.map(async (channel) => {
        let c = new Channel(
          channel.channel_id,
          channel.name,
          channel.date_of_creation,
          channel.admin_id,
          channel.admin,
          channel.admin_picture,
          channel.members_count,
          channel.banner_url,
        );
        c.isUserMember = await c.isUserMember(userId);
        return c;
      }));
      return channels;
    } catch (err) {
      console.error("Error fetching recent channels:", err);
      throw err;
    }
  }

  // CREATE new channel in DB
  static async create(name, banner, adminId) {
    try {
      const result = await db.query(
        `INSERT INTO channels (name, admin_id, banner_url) 
          VALUES ($1, $2, $3) 
          RETURNING *;`,
        [name, adminId, banner.url]
      );

      const newChannel = new Channel(
        result.rows[0].channel_id,
        result.rows[0].name,
        result.rows[0].date_of_creation,
        result.rows[0].admin_id,
        null,
        null,
        0,
        result.rows[0].banner_url,
      );

      await newChannel.addMember(adminId);
      console.log(`New channel created with ID: ${newChannel.channelId}`);
    } catch (err) {
      console.error("Error creating channel:", err);
      throw err;
    }
  }

  // SELECT a specific channel by ID
  static async getById(channelId) {
    try {
      const result = await db.query(
        `SELECT * FROM channels WHERE channel_id = $1;`,
        [channelId]
      );
      const channel = result.rows[0];
      return new Channel(
        channel.channel_id,
        channel.name,
        channel.date_of_creation,
        channel.admin_id,
        null,
        null,
        0,
        channel.banner_url,
      );
    } catch (err) {
      console.error("Error fetching channel:", err);
      throw err;
    }
  }

  // READ channels by name (for search bar)
  static async searchChannels(searchedItem, userId) {
    try {
      const result = await db.query(
        `SELECT ch.channel_id, ch.name, ch.date_of_creation, ch.admin_id, 
          u.profile_picture AS admin_picture, u.username AS admin,
          COUNT(moc.user_id) AS members_count, ch.banner_url
        FROM channels ch
        JOIN users u ON ch.admin_id = u.user_id
        LEFT JOIN members_of_channels moc ON ch.channel_id = moc.channel_id
        WHERE ch.name ILIKE '%' || $1 || '%'
        GROUP BY ch.channel_id, ch.name, ch.date_of_creation, ch.admin_id, u.profile_picture, u.username;`,
        [searchedItem]
      );

      const channels = await Promise.all(result.rows.map(async (channel) => {
        let c = new Channel(
          channel.channel_id,
          channel.name,
          channel.date_of_creation,
          channel.admin_id,
          channel.admin,
          channel.admin_picture,
          channel.members_count,
          channel.banner_url,
        );
        c.isUserMember = await c.isUserMember(userId);
        return c;
      }));
      return channels;
    } catch (err) {
      console.error("Error searching channels:", err);
      throw err;
    }
  }
}

export default Channel;