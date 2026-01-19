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
  // 1. Tạo bảng Users (Admin/Quản lý)
  `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        full_name VARCHAR(100),
        role ENUM('admin', 'manager') DEFAULT 'manager'
    )`,

  // 2. Tạo bảng Residents (Cư dân)
  `CREATE TABLE IF NOT EXISTS residents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        apartment_id INT,
        is_owner BOOLEAN DEFAULT FALSE
    )`,

  // 3. Xóa dữ liệu cũ để tránh trùng lặp
  `DELETE FROM users WHERE username IN ('AD1', 'QL1')`,
  `DELETE FROM residents WHERE username IN ('DC1')`,

  // 4. Thêm Admin mẫu (AD1)
  `INSERT INTO users (username, password, full_name, role) VALUES 
    ('AD1', '123456', 'Super Admin', 'admin'),
    ('QL1', '123456', 'Nguyễn Quản Lý', 'manager')`,

  // 5. Thêm Cư dân mẫu (DC1) - Sửa lỗi đăng nhập của bạn
  `INSERT INTO residents (username, password, full_name, phone, is_owner) VALUES 
    ('DC1', '123456', 'Nguyễn Văn A', '0988888888', TRUE)`,
];

console.log('⏳ Đang khôi phục dữ liệu hệ thống...');

let completed = 0;
queries.forEach((sql, index) => {
  db.query(sql, (err) => {
    if (err) console.error(`❌ Lỗi bước ${index + 1}:`, err.message);
    else console.log(`✅ Bước ${index + 1} thành công.`);

    completed++;
    if (completed === queries.length) {
      console.log('🎉 ĐÃ KHÔI PHỤC XONG! HÃY KHỞI ĐỘNG LẠI SERVER.');
      db.end();
    }
  });
});
