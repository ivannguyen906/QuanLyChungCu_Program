const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'quan_ly_chung_cu',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  ssl:
    process.env.DB_HOST !== 'localhost'
      ? { rejectUnauthorized: true, minVersion: 'TLSv1.2' }
      : false,
});

db.connect();

const queries = [
  // 1. Thêm cột nếu chưa có (đề phòng bạn chưa chạy reset_db mới nhất)
  'ALTER TABLE apartments ADD COLUMN IF NOT EXISTS price BIGINT DEFAULT 0',
  'ALTER TABLE apartments ADD COLUMN IF NOT EXISTS image TEXT',
  'ALTER TABLE apartments ADD COLUMN IF NOT EXISTS direction VARCHAR(100)',
  'ALTER TABLE apartments ADD COLUMN IF NOT EXISTS description TEXT',

  // 2. QUAN TRỌNG: Nâng cấp kiểu dữ liệu để chứa số lớn và link dài
  'ALTER TABLE apartments MODIFY COLUMN price BIGINT',
  'ALTER TABLE apartments MODIFY COLUMN image TEXT',
];

console.log('⏳ Đang nâng cấp bảng Apartments...');

let completed = 0;
queries.forEach((q) => {
  db.query(q, (err) => {
    if (err)
      console.error('⚠️ Lỗi (Có thể bỏ qua nếu cột đã đúng):', err.message);
    else console.log('✅ Thực thi OK:', q.substring(0, 40) + '...');

    completed++;
    if (completed === queries.length) {
      console.log('🎉 ĐÃ NÂNG CẤP XONG! Bạn có thể nhập giá hàng tỷ đồng.');
      db.end();
    }
  });
});
