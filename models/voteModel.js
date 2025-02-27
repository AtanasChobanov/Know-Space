import db from "../config/db.js";

class Vote {
    static VALID_VOTE_TYPES = [1, -1];

    constructor(userId, postId, voteType) {
        this.userId = userId;
        this.postId = postId;
        this.voteType = voteType;
    }

    // READ a vote
    static async findVote(userId, postId) {
        try {
            const result = await db.query(
                `SELECT * FROM post_votes WHERE user_id = $1 AND post_id = $2`,
                [userId, postId]
            );
            if (result.rows.length > 0) {
                const voteResult = result.rows[0];
                return new Vote(voteResult.user_id, voteResult.post_id, voteResult.vote_type);
            } else {
                return null;
            }
        } catch (err) {
            console.error("Error finding vote:", err);
            throw err;
        }
    }
    
    // CREATE a vote
    static async add(userId, postId, voteType) {
        try {
            await db.query(
                `INSERT INTO post_votes (user_id, post_id, vote_type) VALUES ($1, $2, $3)`,
                [userId, postId, voteType]
            );
            return { message: "Vote added" };
        } catch (err) {
            console.error("Error adding vote:", err);
            throw err;
        }
    }

    // UPDATE a vote
    async change(voteType) {
        try {
            await db.query(
                `UPDATE post_votes SET vote_type = $1 WHERE user_id = $2 AND post_id = $3`,
                [voteType, this.userId, this.postId]
            );
        } catch (err) {
            console.error("Error changing vote:", err);
            throw err;
        }
    }

    // DELETE a vote
    async remove() {
        try {
            await db.query(`DELETE FROM post_votes WHERE user_id = $1 AND post_id = $2`, [this.userId, this.postId]);
        } catch (err) {
            console.error("Error removing vote:", err);
            throw err;
        }
    }
}

export default Vote;
