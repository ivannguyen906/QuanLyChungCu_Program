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
  // 1. Tạo bảng Users (Admin/BQL) - Có cột email
  `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        full_name VARCHAR(100),
        email VARCHAR(100),
        role ENUM('admin', 'manager') DEFAULT 'manager'
    )`,

  // 2. Tạo bảng Residents (Cư dân) - THÊM CỘT EMAIL
  `CREATE TABLE IF NOT EXISTS residents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(100) NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        apartment_id INT,
        is_owner BOOLEAN DEFAULT FALSE
    )`,

  // 3. Xóa dữ liệu cũ
  "DELETE FROM users WHERE username IN ('AD1')",
  "DELETE FROM residents WHERE username IN ('DC1')",

  // 4. Nạp Admin mẫu (Thay email của bạn để test)
  `INSERT INTO users (username, password, full_name, email, role) VALUES 
    ('AD1', '123456', 'Super Admin', 'admin@gmail.com', 'admin')`,

  // 5. Nạp Cư dân mẫu (DC1) - CÓ EMAIL (Thay email của bạn để test)
  `INSERT INTO residents (username, password, full_name, email, phone, is_owner) VALUES 
    ('DC1', '123456', 'Nguyễn Văn A', 'cudan@gmail.com', '0988888888', TRUE)`,
];

console.log('⏳ Đang cập nhật cấu trúc bảng và dữ liệu...');

let count = 0;
sqlCmds.forEach((query) => {
  db.query(query, (err) => {
    if (err) console.error('❌ Lỗi SQL:', err.message);
    else console.log('✅ Xong bước ' + (count + 1));

    count++;
    if (count === sqlCmds.length) {
      console.log('🎉 ĐÃ XONG! Database đã có Email.');
      db.end();
    }
  });
});
