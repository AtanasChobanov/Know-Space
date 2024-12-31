import db from "./db.js";

// Вземане на всички постове в даден канал
export async function getPostsFromChannel(channel_id) {
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
      [channel_id]
    );
    return result.rows; // Връщаме списък с постовете
  } catch (err) {
    console.error("Error fetching posts from channel:", err);
    throw err;
  }
}

export async function searchPosts(searchedItem) {
  try {
      const result = await db.query(
        "SELECT post_id, p.title, date_of_creation, date_of_last_edit, author_id, channel_id, " +
          "u.username AS author FROM posts p " +
          "JOIN users u " +
          "ON p.author_id = u.user_id WHERE p.title ILIKE '%' || $1 || '%';",
        [searchedItem]
      );
      
      let posts = [];
      result.rows.forEach((post) => {
        posts.push(post);
      });
  
      console.log("Searched posts result count: " + posts.length);
      return posts;
  } catch(err) {
      console.error("Error executing query: " + err);
      throw new Error("Грешка при търсене на постове в канала.");
  }
}

export async function createPost(title, content, authorId, channelId) {
  try {
    await db.query(
      `INSERT INTO posts (title, content, author_id, channel_id) 
       VALUES ($1, $2, $3, $4);`,
      [title, content, authorId, channelId]
    );
    console.log("New post published.");
  } catch (err) {
    console.error("Error creating post:", err);
    throw err;
  }
}

// Вземане на пост по ID
export async function getPost(postId) {
  try {
    const result = await db.query(
      `SELECT * FROM posts 
       WHERE post_id = $1;`,
      [postId]
    );

    return result.rows[0];
  } catch (err) {
    console.error("Error finding post:", err);
    throw err;
  }
}

export async function updatePost(postId, title, content) {
  try {
    await db.query(
      `UPDATE posts 
       SET title = $1, content = $2, date_of_last_edit = CURRENT_TIMESTAMP 
       WHERE post_id = $3;`,
      [title, content, postId]
    );

    console.log(`Updated post with id: ${postId}.`);
  } catch (err) {
    console.error("Error updating post:", err);
    throw err;
  }
}

export async function deletePost(postId) {
  try {
    await db.query(
      `DELETE FROM posts 
       WHERE post_id = $1;`,
      [postId]
    );
    console.log(`Deleted post with id: ${postId}.`);
  } catch (err) {
    console.error("Error deleting post:", err);
    throw err;
  }
}