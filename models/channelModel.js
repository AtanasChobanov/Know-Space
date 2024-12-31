import db from "./db.js";

// READ channels to display
export async function getUserChannels(userId) {
  try {
    const query = `
      SELECT ch.channel_id, ch.name, ch.date_of_creation, ch.admin_id, u.username AS admin, u.profile_picture AS admin_picture, COUNT(moc.user_id) AS members_count
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

    let channels = [];
    result.rows.forEach((channel) => {
      channel.date_of_creation = new Date(
        channel.date_of_creation
      ).toDateString();
      channels.push(channel);
    });

    return channels;
  } catch (err) {
    console.error("Error fetching user channels:", err);
    throw err;
  }
}

// READ recent channels
export async function getRecentChannels(limit = 8) {
  try {
    const result = await db.query(
      `SELECT ch.channel_id, ch.name, ch.date_of_creation, ch.admin_id, u.username AS admin, u.profile_picture AS admin_picture, COUNT(moc.user_id) AS members_count
         FROM channels ch
         JOIN users u ON ch.admin_id = u.user_id
         LEFT JOIN members_of_channels moc ON ch.channel_id = moc.channel_id
         GROUP BY ch.channel_id, u.username, u.profile_picture
         ORDER BY ch.date_of_creation DESC
         LIMIT $1`,
      [limit]
    );

    let channels = [];
    result.rows.forEach((channel) => {
      channel.date_of_creation = new Date(
        channel.date_of_creation
      ).toDateString();
      channels.push(channel);
    });

    return channels;
  } catch (err) {
    console.error("Error fetching recent channels:", err);
    throw err;
  }
}

export async function createNewChannel(name, adminId) {
  try {
    // Създаване на канала
    const result = await db.query(
      `INSERT INTO channels (name, admin_id) 
       VALUES ($1, $2) 
       RETURNING channel_id;`,
      [name, adminId]
    );

    const newChannelId = result.rows[0].channel_id;

    // Добавяне на създателя като член на канала
    await addMemberToChannel(adminId, newChannelId);
    console.log(`New channel created with ID: ${newChannelId}`);
  } catch (err) {
    console.error("Error creating channel:", err);
    throw err;
  }
}

export async function addMemberToChannel(userId, channelId) {
  try {
    await db.query(
      `INSERT INTO members_of_channels (user_id, channel_id) 
       VALUES ($1, $2);`,
      [userId, channelId]
    );
  } catch (err) {
    console.error("Error adding member to channel:", err);
    throw err;
  }
}

export async function isUserMemberOfChannel(user_id, channel_id) {
  try {
    const result = await db.query(
      `SELECT 1 FROM members_of_channels 
       WHERE user_id = $1 AND channel_id = $2;`,
      [user_id, channel_id]
    );
    return result.rowCount > 0; // Връща true, ако е член
  } catch (err) {
    console.error("Error checking channel membership:", err);
    throw err;
  }
}

export async function getChannel(channel_id) {
  try {
    const result = await db.query(
      `SELECT * FROM channels WHERE channel_id = $1;`,
      [channel_id]
    );
    return result.rows[0];
  } catch (err) {
    console.error("Error fetching channel:", err);
    throw err;
  }
}

export async function searchChannels(searchedItem, user_id) {
  try {
    const result = await db.query(
      `SELECT channel_id, ch.name, date_of_creation, 
       admin_id, u.profile_picture AS admin_picture, 
       u.username AS admin FROM channels ch 
       JOIN users u 
       ON ch.admin_id = u.user_id 
       WHERE ch.name ILIKE '%' || $1 || '%';`,
      [searchedItem]
    );

    // За всеки канал проверяваме дали потребителят е член и форматираме дата
    let channels = result.rows;
    for (let channel of channels) {
      channel.date_of_creation = new Date(
        channel.date_of_creation
      ).toDateString();

      channel.is_member = await isUserMemberOfChannel(
        user_id,
        channel.channel_id
      );
    }
    return channels;
  } catch (err) {
    console.error("Error searching channels:", err);
    throw err;
  }
}

export async function joinChannel(user_id, channel_id) {
  try {
    await db.query(
      "INSERT INTO members_of_channels (user_id, channel_id) VALUES ($1, $2);",
      [user_id, channel_id]
    );
  } catch (err) {
    console.log("Error adding user to channel: " + err);
    throw err;
  }
}

export async function leaveChannel(user_id, channel_id) {
  try {
    // Изтриваме потребителя от таблицата members_of_channels
    await db.query(
      "DELETE FROM members_of_channels WHERE user_id = $1 AND channel_id = $2",
      [user_id, channel_id]
    );

    console.log(
      `User with id ${user_id} left the channel with id ${channel_id}`
    );
  } catch (err) {
    console.log("Error executing query: " + err);
    throw err;
  }
}

export async function updateChannel(newName, channel_id) {
  try{
    await db.query("UPDATE channels SET name = $1 WHERE channel_id = $2;", [
      newName,
      channel_id,
    ]);
    console.log(`Updated channel with id: ${channel_id}.`);
  } catch (err){
    console.error("Error updating channel: " + err);
    throw err;
  }
}

export async function deleteChannel(channel_id) {
  try{
    await db.query("DELETE FROM channels WHERE channel_id = $1;", [
      channel_id,
    ]);
    console.log(`Deleted channel with id: ${channel_id}.`);
  } catch (err){
    console.error("Error deleting channel: " + err);
    throw err;
  }
}