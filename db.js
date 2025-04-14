// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./festival.db');

db.serialize(() => {
  // users 테이블: student_id 추가
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      student_id TEXT UNIQUE,  -- ✅ 교번으로 변경
      password TEXT
    )
  `);

  // reservations 테이블
  db.run(`
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      booth TEXT,
      people INTEGER,
      time TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
});

module.exports = db;
