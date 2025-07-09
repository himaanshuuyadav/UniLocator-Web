DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS connected_devices;
DROP TABLE IF EXISTS pending_devices;

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE connected_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Add your device fields here
);

CREATE TABLE pending_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- Add your device fields here
);