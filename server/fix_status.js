const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'quan_ly_chung_cu',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  // Cấu hình SSL bắt buộc cho TiDB Cloud
  ssl: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  },
});

db.connect((err) => {
  if (err) {
    console.error('❌ Lỗi kết nối:', err.message);
    process.exit(1);
  }
  console.log('✅ Đã kết nối Database.');
});

// Chuyển cột status sang VARCHAR(50) để chấp nhận mọi trạng thái (dat_coc, cho_thue...)
const query =
  "ALTER TABLE apartments MODIFY COLUMN status VARCHAR(50) DEFAULT 'con_trong'";

console.log("🛠️ Đang cập nhật Database để hỗ trợ trạng thái 'Đang đặt cọc'...");

db.query(query, (err) => {
  if (err) {
    console.error('⚠️ Lỗi:', err.message);
  } else {
    console.log(
      "🎉 THÀNH CÔNG! Database đã chấp nhận trạng thái 'dat_coc', 'cho_thue'...",
    );
  }
  db.end();
});
