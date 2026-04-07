const mysql = require('mysql');
require('dotenv').config();

// Sử dụng createPool để duy trì kết nối liên tục
const db = mysql.createPool({
  connectionLimit: 10, // Số lượng kết nối tối đa được giữ trong hàng đợi
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'quan_ly_chung_cu',
  port: process.env.DB_PORT || 4000,
  charset: 'utf8mb4',
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  },
  // Thêm các thuộc tính giúp tự động kiểm tra và kết nối lại
  acquireTimeout: 10000, // Thời gian chờ kết nối (10s)
  waitForConnections: true, // Chờ đến khi có kết nối trống
});

// Kiểm tra kết nối ban đầu
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Kết nối Database thất bại:', err.message);
    return;
  }
  console.log('✅ Đã kết nối thành công tới Pool Database: quan_ly_chung_cu');
  connection.release(); // Giải phóng kết nối sau khi kiểm tra xong
});

module.exports = db;
