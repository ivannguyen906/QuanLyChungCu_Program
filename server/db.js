const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'quan_ly_chung_cu', // Tên database chúng ta đã chốt
  port: process.env.DB_PORT || 4000,
  charset: 'utf8mb4', // Đảm bảo hỗ trợ tiếng Việt hoàn hảo
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  },
});

db.connect((err) => {
  if (err) {
    console.error('❌ Kết nối Database thất bại:', err.message);
    return;
  }
  console.log('✅ Đã kết nối thành công tới Database: quan_ly_chung_cu');
});

module.exports = db;
