const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'quan_ly_chung_cu',
  port: 4000,
  charset: 'utf8mb4', // Ép kiểu UTF-8
  ssl: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
});

db.connect();

// 1. Chuyển đổi toàn bộ bảng về UTF-8
const queries = [
  'ALTER DATABASE quan_ly_chung_cu CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
  'ALTER TABLE apartments CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
  "UPDATE apartments SET owner_name = 'Nguyễn Văn A' WHERE apartment_code = 'CH101'",
  "UPDATE apartments SET owner_name = 'Trần Thị B' WHERE apartment_code = 'CH205'",
];

console.log('--- Đang sửa lỗi font chữ ---');
queries.forEach((q) => {
  db.query(q, (err) => {
    if (err) console.error('❌ Lỗi:', err.sqlMessage);
    else console.log('✅ Đã chạy:', q.substring(0, 50) + '...');
  });
});

setTimeout(() => {
  db.end();
  console.log('--- Đã hoàn tất! Hãy khởi động lại server ---');
}, 3000);
