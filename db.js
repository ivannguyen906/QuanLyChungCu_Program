const mysql = require('mysql2'); // Chuyển sang dùng mysql2
require('dotenv').config();

const db = mysql.createPool({
  connectionLimit: 10,
  host: process.env.CB_HOST, // Đảm bảo khớp với biến trong file .env của bạn
  user: process.env.CB_USER,
  password: process.env.CB_PASSWORD,
  database: process.env.CB_NAME || 'quan_ly_chung_cu',
  port: process.env.CB_PORT || 4000,
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true, // TiDB Cloud yêu cầu SSL để bảo mật
  },
  waitForConnections: true,
  queueLimit: 0,
  enableKeepAlive: true, // Giúp duy trì kết nối không bị TiDB ngắt
  keepAliveInitialDelay: 10000,
});

// Sử dụng bản Promise để dùng được async/await trong các file route
const poolPromise = db.promise();

// Kiểm tra kết nối
db.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Kết nối Database thất bại:', err.message);
    // Log thêm thông tin để debug nếu cần
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Lỗi: Kết nối bị mất (Connection Lost).');
    }
  } else {
    console.log('✅ Đã kết nối thành công tới Pool Database TiDB!');
    connection.release();
  }
});

module.exports = poolPromise;
