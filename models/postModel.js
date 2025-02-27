import db from "../config/db.js";
import PostFilesManager from "./postFilesManagerModel.js";
import { sanitizeHTML } from "../config/sanitize.js";
import Vote from "./voteModel.js";

class Post extends PostFilesManager {
  constructor(
    postId,
    title,
    content,
    authorId,
    channelId,
    dateOfCreation,
    dateOfLastEdit,
    authorName = null,
    authorPicture = null,
    channelName = null
  ) {
    super(postId);

    this.postId = postId;
    this.title = title;
    this.content = content;
    this.authorId = authorId;
    this.channelId = channelId;
    this.dateOfCreation = new Date(dateOfCreation).toLocaleString("bg-BG", {
      timeZone: "Europe/Sofia",
    });
    this.dateOfLastEdit = dateOfLastEdit
      ? new Date(dateOfLastEdit).toLocaleString("bg-BG", {
          timeZone: "Europe/Sofia",
        })
      : null;
    this.authorName = authorName;
    this.authorPicture = authorPicture;
    this.channelName = channelName;
  }

  // UPDATE an existing post
  async update(title, content, deletedFiles, newFiles) {
    try {
      const sanitizedTitle = title.trim();
      const sanitizedContent = sanitizeHTML(content);
      await db.query(
        `UPDATE posts 
         SET title = $1, content = $2, date_of_last_edit = CURRENT_TIMESTAMP 
         WHERE post_id = $3;`,
        [sanitizedTitle, sanitizedContent, this.postId]
      );

      // Изтриване на избраните файлове
      if (deletedFiles && deletedFiles.length > 0) {
        await this.deleteFiles(deletedFiles);
      }

      // Качване на нови файлове
      if (newFiles && newFiles.length > 0) {
        await this.uploadFilesToCloudinary(newFiles);
      }
    } catch (err) {
      console.error("Error updating post:", err);
      throw err;
    }
  }

  // DELETE a post
  async delete() {
    try {
      this.deleteAllFiles();
      await db.query(
        `DELETE FROM posts 
         WHERE post_id = $1;`,
        [this.postId]
      );
      console.log(`Post with ID ${this.postId} deleted.`);
    } catch (err) {
      console.error("Error deleting post:", err);
      throw err;
    }
  }

  // Manage voting on a post
  async vote(userId, voteType) {
    try {
      const existingVote = await Vote.findVote(userId, this.postId);

      if (existingVote) {
        if (existingVote.voteType === voteType) {
          await existingVote.remove();
        } else {
          await existingVote.change(voteType);
        }
      } else {
        await Vote.add(userId, this.postId, voteType);
      }
    } catch (err) {
      console.error("Error voting on post:", err);
      throw err;
    }
  }

  // READ all votes for a post
  async getVotes(userId) {
    try {
      const result = await db.query(
        `SELECT 
              SUM(CASE WHEN vote_type = 1 THEN 1 ELSE 0 END) AS upvotes,
              SUM(CASE WHEN vote_type = -1 THEN 1 ELSE 0 END) AS downvotes,
              (SELECT vote_type FROM post_votes WHERE post_id = $1 AND user_id = $2) AS user_vote 
          FROM post_votes WHERE post_id = $1`,
        [this.postId, userId]
      );
      return result.rows[0];
    } catch (err) {
      console.error("Error fetching votes:", err);
      throw err;
    }
  }

  // Helper function to fetch posts
  static async #fetchPosts(query, params) {
    try {
      const result = await db.query(query, params);

      const posts = result.rows.map(
        (post) =>
          new Post(
            post.post_id,
            post.title,
            post.content,
            post.author_id,
            post.channel_id,
            post.date_of_creation,
            post.date_of_last_edit,
            post.author,
            post.profile_picture,
            post.channel_name
          )
      );

      // Load files for each post
      for (const post of posts) {
        await post.getFiles();
      }

      return posts;
    } catch (err) {
      console.error("Error fetching posts:", err);
      throw err;
    }
  }

  // READ all posts from the user's channels
  static async getFromUserChannels(userId) {
    const query = `SELECT ch.name AS channel_name, p.post_id, p.title, p.content, p.author_id, p.channel_id,
         u.username AS author, u.profile_picture, p.date_of_creation, p.date_of_last_edit 
         FROM posts p 
         JOIN channels ch ON ch.channel_id = p.channel_id 
         JOIN users u ON p.author_id = u.user_id
         JOIN members_of_channels mc ON ch.channel_id = mc.channel_id
         WHERE mc.user_id = $1
         ORDER BY p.date_of_creation DESC;`;
    return Post.#fetchPosts(query, [userId]);
  }

  // READ all posts from a specific channel by ID
  static async getFromChannel(channelId) {
    const query = `SELECT ch.name AS channel_name, post_id, title, content, author_id, p.channel_id, 
         u.username AS author, u.profile_picture, p.date_of_creation, date_of_last_edit 
         FROM posts p 
         JOIN channels ch 
         ON ch.channel_id = p.channel_id 
         JOIN users u 
         ON p.author_id = u.user_id 
         WHERE ch.channel_id = $1 
         ORDER BY date_of_creation DESC;`;
    return Post.#fetchPosts(query, [channelId]);
  }

  // CREATE a new post
  static async create(title, content, authorId, channelId, files) {
    try {
      const sanitizedTitle = title.trim();
      const sanitizedContent = sanitizeHTML(content);
      const result = await db.query(
        `INSERT INTO posts (title, content, author_id, channel_id) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *;`,
        [sanitizedTitle, sanitizedContent, authorId, channelId]
      );

      let post = result.rows[0];
      post = new Post(
        post.post_id,
        post.title,
        post.content,
        post.author_id,
        post.channel_id,
        post.date_of_creation,
        post.date_of_last_edit
      );
      await post.uploadFilesToCloudinary(files);
      console.log(`New post created with ID: ${post.postId}`);
    } catch (err) {
      console.error("Error creating post:", err);
      throw err;
    }
  }

  // Search posts by title
  static async search(searchedItem, channelId) {
    const query = 
      `SELECT p.post_id, p.title, p.content, p.author_id, p.channel_id, p.date_of_creation, p.date_of_last_edit, 
       u.username AS author, u.profile_picture, ch.name AS channel_name
       FROM posts p 
       JOIN users u ON p.author_id = u.user_id 
       JOIN channels ch ON p.channel_id = ch.channel_id
       WHERE p.title ILIKE '%' || $1 || '%' AND p.channel_id = $2;`;
    return Post.#fetchPosts(query, [searchedItem, channelId]);
  }

  // READ a specific post by ID
  static async getById(postId) {
    try {
      const parsedPostId = parseInt(postId, 10);

      const result = await db.query(
        `SELECT * FROM posts 
         WHERE post_id = $1;`,
        [parsedPostId]
      );

      if (result.rows.length === 0) return null;

      const data = result.rows[0];
      const post = new Post(
        data.post_id,
        data.title,
        data.content,
        data.author_id,
        data.channel_id,
        data.date_of_creation,
        data.date_of_last_edit
      );
      await post.getFiles();
      return post;
    } catch (err) {
      // console.error("Error finding post:", err);
      throw err;
    }
  }
}

export default Post;