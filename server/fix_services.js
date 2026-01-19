const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'quan_ly_chung_cu',
  port: 4000,
  charset: 'utf8mb4',
  // QUAN TRỌNG: Thêm dòng này để sửa lỗi kết nối Cloud
  ssl: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
});

db.connect();

const queries = [
  "UPDATE services SET name = 'Tiền điện' WHERE service_key = 'dien'",
  "UPDATE services SET name = 'Tiền nước' WHERE service_key = 'nuoc'",
  "UPDATE services SET name = 'Phí quản lý' WHERE service_key = 'quan_ly'",
  "UPDATE services SET name = 'Gửi xe máy' WHERE service_key = 'gui_xe_may'",
  "UPDATE services SET name = 'Gửi ô tô' WHERE service_key = 'gui_o_to'",
];

console.log('--- Đang sửa tên dịch vụ ---');
queries.forEach((q) => {
  db.query(q, (err) => {
    if (err) console.error('❌ Lỗi:', err.message);
    else console.log('✅ Đã sửa xong:', q);
  });
});

setTimeout(() => {
  db.end();
  console.log('--- Hoàn tất! Hãy F5 lại trình duyệt ---');
}, 3000);
