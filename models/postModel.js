import db from "../config/db.js";

class Post {
  constructor(postId, title, content, authorId, channelId, dateOfCreation, dateOfLastEdit, author = null) {
    this.postId = postId;
    this.title = title;
    this.content = content;
    this.authorId = authorId;
    this.channelId = channelId;
    this.dateOfCreation = new Date(dateOfCreation).toLocaleString('bg-BG', { timeZone: 'Asia/Dubai' });
    this.dateOfLastEdit = dateOfLastEdit
      ? new Date(dateOfLastEdit).toLocaleString('bg-BG', { timeZone: 'Asia/Dubai' })
      : null;
    this.author = author;
  }

  // UPDATE an existing post
  async update(title, content) {
    try {
      await db.query(
        `UPDATE posts 
         SET title = $1, content = $2, date_of_last_edit = CURRENT_TIMESTAMP 
         WHERE post_id = $3;`,
        [title, content, this.postId]
      );
    } catch (err) {
      console.error("Error updating post:", err);
      throw err;
    }
  }

  // DELETE a post
  async delete() {
    try {
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
  
  // READ all posts from a specific channel by ID
  static async getFromChannel(channelId) {
    try {
      const result = await db.query(
        `SELECT ch.name, post_id, title, content, author_id, 
         u.username AS author, p.date_of_creation, date_of_last_edit 
         FROM posts p 
         JOIN channels ch 
         ON ch.channel_id = p.channel_id 
         JOIN users u 
         ON p.author_id = u.user_id 
         WHERE ch.channel_id = $1 
         ORDER BY date_of_creation DESC;`,
        [channelId]
      );

      return result.rows.map(
        (post) =>
          new Post(
            post.post_id,
            post.title,
            post.content,
            post.author_id,
            post.channel_id,
            post.date_of_creation,
            post.date_of_last_edit,
            post.author
          )
      );
    } catch (err) {
      console.error("Error fetching posts from channel:", err);
      throw err;
    }
  }

  // CREATE a new post
  static async create(title, content, authorId, channelId) {
    try {
      const result = await db.query(
        `INSERT INTO posts (title, content, author_id, channel_id) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *;`,
        [title, content, authorId, channelId]
      );

      const post = result.rows[0];
      return new Post(
        post.post_id,
        post.title,
        post.content,
        post.author_id,
        post.channel_id,
        post.date_of_creation,
        post.date_of_last_edit
      );
    } catch (err) {
      console.error("Error creating post:", err);
      throw err;
    }
  }

  // Search posts by title
  static async search(searchedItem, channelId) {
    try {
      const result = await db.query(
        `SELECT post_id, p.title, content, date_of_creation, date_of_last_edit, author_id, channel_id, 
         u.username AS author 
         FROM posts p 
         JOIN users u 
         ON p.author_id = u.user_id 
         WHERE p.title ILIKE '%' || $1 || '%' AND channel_id = $2;`,
        [searchedItem, channelId]
      );

      return result.rows.map(
        (post) =>
          new Post(
            post.post_id,
            post.title,
            post.content,
            post.author_id,
            post.channel_id,
            post.date_of_creation,
            post.date_of_last_edit,
            post.author
          )
      );
    } catch (err) {
      console.error("Error searching posts:", err);
      throw err;
    }
  }

  // READ a specific post by ID
  static async getById(postId) {
    try {
      const result = await db.query(
        `SELECT * FROM posts 
         WHERE post_id = $1;`,
        [postId]
      );

      if (result.rows.length === 0) return null;

      const post = result.rows[0];
      return new Post(
        post.post_id,
        post.title,
        post.content,
        post.author_id,
        post.channel_id,
        post.date_of_creation,
        post.date_of_last_edit
      );
    } catch (err) {
      console.error("Error finding post:", err);
      throw err;
    }
  }
}

export default Post;