CREATE TABLE IF NOT EXISTS users
(
    user_id SERIAL PRIMARY KEY,
    email character varying(100) NOT NULL UNIQUE,
    username character varying(50) NOT NULL UNIQUE,
    password text NOT NULL,
    user_type character varying(6) NOT NULL,
    bio character varying(200),
    profile_picture character varying(200)
);

CREATE TABLE IF NOT EXISTS channels
(
    channel_id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    admin_id integer NOT NULL,
    date_of_creation date DEFAULT CURRENT_DATE,
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
    content character varying(2000) NOT NULL,
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