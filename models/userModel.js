import db from "./db.js";
import bcrypt from "bcrypt";

const saltRounds = 10;
// Array for random profile picture selection
const defaultAvatars = [
  "default-avatar-1.jpg",
  "default-avatar-2.jpg",
  "default-avatar-3.jpg",
  "default-avatar-4.jpg",
];

export async function createNewUser(
  email,
  username,
  password,
  userType,
  avatar
) {
  try {
    if (!avatar) {
      avatar =
        "/uploads/profile-pictures/" +
        defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
    }

    if(password !== "google") {
      password = await bcrypt.hash(password, saltRounds);
    }

    const result = await db.query(
      `INSERT INTO users (email, password, username, user_type, profile_picture) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING *`,
      [email, password, username, userType, avatar]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error creating user:", err);
    throw err;
  }
}

// Намиране на потребител по имейл
export async function getUserByEmail(email) {
  const result = await db.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
}

// Проверка на паролата
export async function verifyPassword(inputPassword, storedPassword) {
  try {
    const isMatch = await bcrypt.compare(inputPassword, storedPassword);
    return isMatch;
  } catch (err) {
    console.error("Error verifying password:", err);
    throw err;
  }
}

// Вземане на информация за потребител
export async function getForeignUserById(userId) {
  const result = await db.query(
    "SELECT user_id, username, user_type, bio, profile_picture FROM users WHERE user_id = $1;",
    [userId]
  );
  return result.rows[0];
}

// Вземане на постовете на потребител
export async function getUserPosts(userId) {
  const result = await db.query(
    "SELECT post_id, title, content, date_of_creation, date_of_last_edit FROM posts WHERE author_id = $1 ORDER BY date_of_creation DESC;",
    [userId]
  );
  return result.rows;
}

export async function updateUser(username, bio, user_id) {
  await db.query(
    "UPDATE users SET username = $1, bio = $2 WHERE user_id = $3;",
    [username, bio, user_id]
  );

  return getUserById(user_id);
}

// Проверка на текущата парола
export async function checkPassword(user_id, inputPassword) {
  const result = await db.query(
    "SELECT password FROM users WHERE user_id = $1",
    [user_id]
  );
  const storedHashedPassword = result.rows[0].password;
  return verifyPassword(inputPassword, storedHashedPassword);
}

// Актуализиране на паролата
export async function updatePassword(user_id, newPassword) {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = $1 WHERE user_id = $2", [
      hashedPassword,
      user_id,
    ]);

    return getUserById(user_id);
  } catch (err) {
    console.error("Error updating password:", err);
    throw err;
  }
}

async function getUserById(user_id) {
  const result = await db.query("SELECT * FROM users WHERE user_id = $1;", [
    user_id,
  ]);

  return result.rows[0];
}
