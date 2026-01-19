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

const sqlCmds = [
  // 1. Tạo bảng Users (Admin) nếu chưa có
  `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        full_name VARCHAR(100),
        role ENUM('admin', 'manager') DEFAULT 'manager'
    )`,

  // 2. Tạo bảng Residents (Cư dân) nếu chưa có
  `CREATE TABLE IF NOT EXISTS residents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        apartment_id INT,
        is_owner BOOLEAN DEFAULT FALSE
    )`,

  // 3. Xóa dữ liệu cũ của AD1 và DC1 để tránh lỗi trùng lặp
  "DELETE FROM users WHERE username IN ('AD1')",
  "DELETE FROM residents WHERE username IN ('DC1')",

  // 4. Thêm lại Admin (AD1)
  `INSERT INTO users (username, password, full_name, role) VALUES 
    ('AD1', '123456', 'Super Admin', 'admin')`,

  // 5. Thêm lại Cư dân (DC1) - Đây là tài khoản bạn đang thử đăng nhập
  `INSERT INTO residents (username, password, full_name, phone, is_owner) VALUES 
    ('DC1', '123456', 'Nguyễn Văn A', '0909999999', TRUE)`,
];

console.log('⏳ Đang nạp dữ liệu tài khoản...');

let count = 0;
sqlCmds.forEach((query) => {
  db.query(query, (err) => {
    if (err) console.error('❌ Lỗi SQL:', err.message);
    else console.log('✅ Thực thi OK.');

    count++;
    if (count === sqlCmds.length) {
      console.log('🎉 XONG! Dữ liệu người dùng đã sẵn sàng.');
      db.end();
    }
  });
});
