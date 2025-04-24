import db from "../config/db.js";
import bcrypt from "bcrypt";
import Post from "./postModel.js";
import cloudinary  from "../config/cloudinary.js";
import fs from "fs/promises";
import File from "./fileModel.js";

const saltRounds = 10;
const defaultAvatars = [
  "default-avatar-1.jpg",
  "default-avatar-2.jpg",
  "default-avatar-3.jpg",
  "default-avatar-4.jpg",
];

class User {
  constructor(
    userId,
    email,
    username,
    password,
    userType,
    bio,
    profilePicture
  ) {
    this.userId = userId;
    this.email = email;
    this.username = username;
    this.password = password;
    this.userType = userType;
    this.bio = bio;
    this.profilePicture = profilePicture;
  }

  async getPosts() {
    const result = await db.query(
      `SELECT p.post_id, p.title, p.content, p.channel_id, p.date_of_creation, p.date_of_last_edit, ch.name AS channel_name 
       FROM posts p 
       JOIN channels ch ON p.channel_id = ch.channel_id 
       WHERE p.author_id = $1 
       ORDER BY GREATEST(p.date_of_creation, COALESCE(p.date_of_last_edit, p.date_of_creation)) DESC;`,
      [this.userId]
    );

    const posts = result.rows.map(
      (post) =>
        new Post(
          post.post_id,
          post.title,
          post.content,
          this.userId,
          post.channel_id,
          post.date_of_creation,
          post.date_of_last_edit,
          this.username,
          null,
          post.channel_name
        )
    );
    await Promise.all(posts.map((post) => post.getFiles()));
    return posts;
  }

  async update(username, bio) {
    await db.query(
      "UPDATE users SET username = $1, bio = $2 WHERE user_id = $3;",
      [username, bio, this.userId]
    );
  }

  async #verifyPassword(inputPassword) {
    try {
      const result = await db.query(
        "SELECT password FROM users WHERE user_id = $1",
        [this.userId]
      );
      const storedHashedPassword = result.rows[0].password;
      return await bcrypt.compare(inputPassword, storedHashedPassword);
    } catch (err) {
      console.error("Error verifying password:", err);
      throw err;
    }
  }

  async updatePassword(oldPassword, newPassword) {
    try {
      const isMatch = await this.#verifyPassword(oldPassword);

      if (!isMatch) {
        return { errorMessage: "Старата парола не е правилна." };
      }

      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
      await db.query("UPDATE users SET password = $1 WHERE user_id = $2", [
        hashedPassword,
        this.userId,
      ]);
      return User.#getById(this.userId);
    } catch (err) {
      console.error("Error updating password:", err);
      throw err;
    }
  }

  async loginVerification(inputPassword) {
    return await this.#verifyPassword(inputPassword);
  }

  async updateProfilePicture(avatar) {
    try {
      await this.deleteProfilePicture();
      await db.query(
        "UPDATE users SET profile_picture = $1 WHERE user_id = $2",
        [avatar.url, this.userId]
      );
    } catch (err) {
      console.error("Error updating profile picture:", err);
      throw err;
    }
  }

  async deleteProfilePicture() {
    try {
      if (this.#isCustomAvatar()) {
        const avatarFile = new File(null, null, this.profilePicture, "image", null);
        await avatarFile.deleteFromCloudinary();

        const newAvatar = User.#randomDefaultAvatar();
        await db.query(
          "UPDATE users SET profile_picture = $1 WHERE user_id = $2",
          [newAvatar, this.userId]
        );
      }
    } catch (err) {
      console.error("Error deleting profile picture:", err);
      throw err;
    }
  }

  #isCustomAvatar() {
    return this.profilePicture.includes("res.cloudinary.com"); // Returns true if there is cloudinary in the URL
  }

  static #randomDefaultAvatar() {
    return "/uploads/profile-pictures/" + defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
  }

  static async getTotalUsers() {
    try {
      const result = await db.query('SELECT COUNT(*) as count FROM users');
      return parseInt(result.rows[0].count);
    } catch (err) {
      console.error('Error counting users:', err);
      throw err;
    }
  }

  static async #getById(userId) {
    const result = await db.query("SELECT * FROM users WHERE user_id = $1;", [
      userId,
    ]);
    if (result.rows[0]) {
      const userData = result.rows[0];
      return new User(
        userData.user_id,
        userData.email,
        userData.username,
        userData.password,
        userData.user_type,
        userData.bio,
        userData.profile_picture
      );
    }
    return null;
  }

  static async create(email, username, password, userType, avatar) {
    try {
      avatar = !avatar ? User.#randomDefaultAvatar() : avatar;

      if (password !== "google") {
        password = await bcrypt.hash(password, saltRounds);
      }

      const result = await db.query(
        `INSERT INTO users (email, password, username, user_type, profile_picture) 
        VALUES ($1, $2, $3, $4, $5) 
        RETURNING *`,
        [email, password, username, userType, avatar]
      );
      const userData = result.rows[0];
      return new User(
        userData.user_id,
        userData.email,
        userData.username,
        userData.password,
        userData.user_type,
        userData.bio,
        userData.profile_picture
      );
    } catch (err) {
      console.error("Error creating user:", err);
      throw err;
    }
  }

  static async getForeignUserByEmail(email) {
    const result = await db.query(
      "SELECT user_id, username, user_type, bio, profile_picture FROM users WHERE email = $1;",
      [email]
    );

    if (result.rows[0]) {
      const userData = result.rows[0];
      return new User(
        userData.user_id,
        null,
        userData.username,
        null,
        userData.user_type,
        userData.bio,
        userData.profile_picture
      );
    }
    return null;
  }

  static async getForeignUserById(userId) {
    const result = await db.query(
      "SELECT user_id, username, user_type, bio, profile_picture FROM users WHERE user_id = $1;",
      [userId]
    );

    if (result.rows[0]) {
      const userData = result.rows[0];
      return new User(
        userData.user_id,
        null,
        userData.username,
        null,
        userData.user_type,
        userData.bio,
        userData.profile_picture
      );
    }
    return null;
  }

  static async getGoogleUserByEmail(email) {
    let user = await User.getForeignUserByEmail(email);
    if (user) {
      user = await User.#getById(user.userId);
      return user;
    } else {
      return null;
    }
  }
}

export default User;
