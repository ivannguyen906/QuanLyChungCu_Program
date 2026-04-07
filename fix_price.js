const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'quan_ly_chung_cu',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  // --- QUAN TRỌNG: CẤU HÌNH SSL CHO TIDB CLOUD ---
  ssl: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  },
});

db.connect((err) => {
  if (err) {
    console.error('❌ Lỗi kết nối:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Đã kết nối Database an toàn (SSL).');
  }
});

const queries = [
  // 1. Nâng cấp cột GIÁ lên BIGINT (Chứa được số siêu lớn)
  'ALTER TABLE apartments MODIFY COLUMN price BIGINT DEFAULT 0',

  // 2. Nâng cấp cột ẢNH lên TEXT (Để chứa link ảnh dài)
  'ALTER TABLE apartments MODIFY COLUMN image TEXT',

  // 3. Thêm các cột phụ nếu thiếu (Phòng trường hợp chưa có)
  'ALTER TABLE apartments ADD COLUMN IF NOT EXISTS direction VARCHAR(100)',
  'ALTER TABLE apartments ADD COLUMN IF NOT EXISTS description TEXT',
];

console.log('🛠️ Đang nâng cấp Database...');

let completed = 0;
queries.forEach((q) => {
  db.query(q, (err) => {
    // Lỗi ER_DUP_FIELDNAME có thể bỏ qua nếu cột đã tồn tại
    if (err && err.code !== 'ER_DUP_FIELDNAME') {
      console.error('⚠️ Cảnh báo:', err.message);
    } else {
      console.log('✅ Thực thi OK:', q.substring(0, 50) + '...');
    }

    completed++;
    if (completed === queries.length) {
      console.log('\n🎉 NÂNG CẤP THÀNH CÔNG!');
      console.log('👉 Bây giờ bạn có thể nhập giá 5.2 tỷ thoải mái.');
      db.end();
    }
  });
});
