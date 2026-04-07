const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'quan_ly_chung_cu',
  port: 4000,
  charset: 'utf8mb4',
  ssl: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
});

db.connect();

const queries = [
  // 1. Ép kiểu bảng users sang UTF-8 để nhận tiếng Việt
  'ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',

  // 2. Sửa lại tên hiển thị của tài khoản QL1 cho đẹp
  "UPDATE users SET full_name = 'Nguyễn Quản Lý' WHERE username = 'QL1'",

  // 3. Sửa lại tên Admin nếu cần
  "UPDATE users SET full_name = 'Quản Trị Viên' WHERE username = 'AD1'",
];

console.log('--- Đang đồng bộ dữ liệu Nhân sự ---');
queries.forEach((q) => {
  db.query(q, (err) => {
    if (err) console.error('❌ Lỗi:', err.message);
    else console.log('✅ Đã chạy:', q.substring(0, 60) + '...');
  });
});

setTimeout(() => {
  db.end();
  console.log('--- XONG! Hãy F5 lại trang Web ---');
}, 2000);
