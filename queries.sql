CREATE TABLE IF NOT EXISTS users
(
    user_id SERIAL PRIMARY KEY,
    email character varying(100) NOT NULL UNIQUE,
    username character varying(50) NOT NULL UNIQUE,
    password text NOT NULL,
    user_type character varying(6) NOT NULL,
    bio character varying(200),
    profile_picture character varying(200),
    date_of_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS channels
(
    channel_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    admin_id integer NOT NULL,
    date_of_creation date DEFAULT CURRENT_DATE,
    banner_url TEXT,
    CONSTRAINT fk_channels_users FOREIGN KEY (admin_id)
        REFERENCES users (user_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS members_of_channels
(
    user_id integer NOT NULL,
    channel_id integer NOT NULL,
    PRIMARY KEY (user_id, channel_id),
    CONSTRAINT fk_members_of_channels_channels FOREIGN KEY (channel_id)
        REFERENCES channels (channel_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_members_of_channels_users FOREIGN KEY (user_id)
        REFERENCES users (user_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS posts
(
    post_id SERIAL PRIMARY KEY,
    title character varying(100) NOT NULL,
    content character varying(5000) NOT NULL,
    author_id integer NOT NULL,
    date_of_creation timestamp DEFAULT CURRENT_TIMESTAMP,
    date_of_last_edit timestamp ,
    channel_id integer NOT NULL,
    CONSTRAINT fk_posts_channels FOREIGN KEY (channel_id)
        REFERENCES channels (channel_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_posts_users FOREIGN KEY (author_id)
        REFERENCES users (user_id) MATCH SIMPLE
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_files (
    file_id SERIAL PRIMARY KEY,           
    post_id INTEGER NOT NULL,             
    url TEXT NOT NULL,               
    type VARCHAR(50) NOT NULL,       
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_post_files_posts 
        FOREIGN KEY (post_id)
        REFERENCES posts (post_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_votes (
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    vote_type SMALLINT CHECK (vote_type IN (-1, 1)), -- -1 за downvote, 1 за upvote
    PRIMARY KEY (user_id, post_id),
    CONSTRAINT fk_votes_users 
        FOREIGN KEY (user_id) 
        REFERENCES users (user_id) 
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_votes_posts 
        FOREIGN KEY (post_id) 
        REFERENCES posts (post_id) 
        ON UPDATE CASCADE
        ON DELETE CASCADE
);
