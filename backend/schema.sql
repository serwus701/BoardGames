CREATE DATABASE IF NOT EXISTS boardgames;

USE boardgames;

CREATE TABLE IF NOT EXISTS board_games (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    length_minutes INT NOT NULL,
    min_players INT NOT NULL,
    max_players INT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    event_date DATE NOT NULL,
    location VARCHAR(200),
    notes TEXT,
    board_game_id INT,
    CONSTRAINT fk_events_board_games
        FOREIGN KEY (board_game_id)
        REFERENCES board_games(id)
        ON DELETE SET NULL
);
