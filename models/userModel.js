import db from "../config/db.js";
import bcrypt from "bcrypt";
import Post from "./postModel.js";

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
      "SELECT post_id, title, content, date_of_creation, date_of_last_edit FROM posts WHERE author_id = $1 ORDER BY date_of_creation DESC;",
      [this.userId]
    );

    return result.rows.map(
        (post) =>
          new Post(
            post.post_id,
            post.title,
            post.content,
            this.userId,
            null,
            post.date_of_creation,
            post.date_of_last_edit,
            this.username
          )
      );
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
      if (!avatar) {
        avatar =
          "/uploads/profile-pictures/" +
          defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
      }

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
