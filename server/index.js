const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const multer = require('multer');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const { GoogleGenerativeAI } = require('@google/generative-ai');
// Lưu ý: Nên để API Key trong file .env để bảo mật
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || 'AIzaSyCiDaVoP_LH3fWbXV33xL7N3Tv7dBYEYvU',
);

const nodemailer = require('nodemailer');

// =======================================================
// 1. KẾT NỐI DATABASE (Hỗ trợ Localhost & TiDB Cloud)
// =======================================================
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: 'quan_ly_chung_cu',
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  ssl: {},
};

// Bật SSL nếu kết nối Cloud
if (dbConfig.host !== 'localhost' && dbConfig.host !== '127.0.0.1') {
  dbConfig.ssl = { rejectUnauthorized: true, minVersion: 'TLSv1.2' };
}

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) console.error('❌ Lỗi kết nối Database:', err.message);
  else console.log('✅ Đã kết nối Database thành công!');
});

// Hàm Wrapper để dùng Async/Await
function queryDB(sql, params) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

// =======================================================
// 2. API ĐĂNG NHẬP
// =======================================================
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  // BƯỚC 1: Kiểm tra trong bảng nhân viên (users) trước
  const sqlAdmin = 'SELECT * FROM users WHERE username = ? AND password = ?';

  db.query(sqlAdmin, [username, password], (err, result) => {
    if (err) return res.status(500).json(err);

    // NẾU TÌM THẤY ADMIN/QUẢN LÝ
    if (result.length > 0) {
      const user = result[0];
      return res.json({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        role: user.role, // 'admin' hoặc 'manager'
        image: '',
      });
    }

    // BƯỚC 2: Nếu không phải Admin, kiểm tra bảng cư dân (residents)
    const sqlRes = `
            SELECT r.*, a.apartment_code 
            FROM residents r 
            LEFT JOIN apartments a ON r.apartment_id = a.id 
            WHERE r.username = ? AND r.password = ?
        `;

    db.query(sqlRes, [username, password], (err, resultRes) => {
      if (err) return res.status(500).json(err);

      // NẾU TÌM THẤY CƯ DÂN
      if (resultRes.length > 0) {
        const resident = resultRes[0];
        return res.json({
          id: resident.id,
          username: resident.username,
          full_name: resident.full_name,
          role: 'resident', // Vai trò cố định là resident
          apartment_id: resident.apartment_id,
          apartment_code: resident.apartment_code,
          image: resident.image,
        });
      }

      // KHÔNG TÌM THẤY Ở CẢ 2 BẢNG
      return res
        .status(401)
        .json({ message: 'Sai tên đăng nhập hoặc mật khẩu!' });
    });
  });
});

// =======================================================
// 3. DASHBOARD
// =======================================================
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalApts = await queryDB('SELECT COUNT(*) as count FROM apartments');
    const totalResidents = await queryDB(
      'SELECT COUNT(*) as count FROM residents',
    );
    const revenue = await queryDB(
      "SELECT SUM(total_amount) as total FROM bills WHERE status = 'paid'",
    );
    const statusData = await queryDB(
      'SELECT status, COUNT(*) as count FROM apartments GROUP BY status',
    );
    const revenueData = await queryDB(
      'SELECT month, SUM(total_amount) as total FROM bills GROUP BY month ORDER BY month',
    );

    res.json({
      success: true,
      data: {
        total_apartments: totalApts[0].count,
        total_residents: totalResidents[0].count,
        total_revenue: revenue[0].total || 0,
        chart_status: statusData,
        chart_revenue: revenueData,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =======================================================
// 4. API QUẢN LÝ CĂN HỘ
// =======================================================
app.get('/api/apartments', (req, res) => {
  db.query(
    'SELECT * FROM apartments ORDER BY apartment_code ASC',
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    },
  );
});

app.post('/api/apartments', (req, res) => {
  const {
    apartment_code,
    floor,
    area,
    status,
    owner_name,
    image,
    rental_price,
  } = req.body;
  const code =
    apartment_code || `CH${floor}${Math.floor(Math.random() * 90 + 10)}`;

  const safePrice = price || 0;
  const safeImage = image || '';

  const sql =
    'INSERT INTO apartments (apartment_code, floor, area, status, owner_name, image, rental_price) VALUES (?, ?, ?, ?, ?, ?, ?)';
  db.query(
    sql,
    [code, floor, area, status, owner_name, safeImage, safePrice],
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Thêm thành công', id: result.insertId });
    },
  );
});

app.put('/api/apartments/:id', (req, res) => {
  const { floor, area, status, owner_name, image } = req.body;
  const price = req.body.price || req.body.rental_price || 0;

  const sql =
    'UPDATE apartments SET floor=?, area=?, status=?, owner_name=?, image=?, rental_price=? WHERE id=?';

  db.query(
    sql,
    [floor, area, status, owner_name, image || '', price || 0, req.params.id],
    (err) => {
      if (err) {
        console.error('❌ Lỗi DB:', err); // Thêm dòng này để hiện lỗi ra terminal sau này
        return res.status(500).json(err);
      }
      res.json({ message: 'Cập nhật thành công' });
    },
  );
});

app.delete('/api/apartments/:id', (req, res) => {
  db.query('DELETE FROM apartments WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Đã xóa' });
  });
});

// =======================================================
// 5. QUẢN LÝ CƯ DÂN (ĐÃ CẬP NHẬT: CHẶN TRÙNG EMAIL)
// =======================================================
app.get('/api/residents', (req, res) => {
  const sql = `SELECT r.*, a.apartment_code, a.status as apartment_status 
                 FROM residents r 
                 LEFT JOIN apartments a ON r.apartment_id = a.id 
                 ORDER BY r.id DESC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

app.post('/api/residents', async (req, res) => {
  const {
    full_name,
    username,
    phone,
    email,
    apartment_id,
    password,
    is_owner,
  } = req.body;

  try {
    // --- 1. KIỂM TRA TRÙNG EMAIL ---
    if (email && email.trim() !== '') {
      // Kiểm tra trong bảng Users (Admin)
      const dupUser = await queryDB('SELECT id FROM users WHERE email = ?', [
        email,
      ]);
      if (dupUser.length > 0) {
        return res.status(400).json({
          message: 'Email này đã được sử dụng bởi một Quản trị viên!',
        });
      }
      // Kiểm tra trong bảng Residents (Cư dân)
      const dupRes = await queryDB('SELECT id FROM residents WHERE email = ?', [
        email,
      ]);
      if (dupRes.length > 0) {
        return res
          .status(400)
          .json({ message: 'Email này đã được sử dụng bởi Cư dân khác!' });
      }
    }

    // --- 2. THÊM MỚI ---
    const userCode = username || `TEMP${Date.now()}`;
    const pass = password || '123456';

    const sqlInsert =
      'INSERT INTO residents (full_name, username, phone, email, apartment_id, is_owner, password) VALUES (?, ?, ?, ?, ?, ?, ?)';

    await queryDB(sqlInsert, [
      full_name,
      userCode,
      phone,
      email,
      apartment_id,
      is_owner,
      pass,
    ]);

    // Cập nhật trạng thái căn hộ nếu là chủ hộ
    if (Number(is_owner) === 1 && apartment_id) {
      await queryDB("UPDATE apartments SET status = 'da_ban' WHERE id = ?", [
        apartment_id,
      ]);
    }

    res.json({ success: true, message: 'Thêm cư dân thành công' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res
        .status(400)
        .json({ message: 'Mã cư dân (Username) đã tồn tại!' });
    return res.status(500).json({ message: err.message });
  }
});

app.put('/api/residents/:id', async (req, res) => {
  const {
    full_name,
    username,
    phone,
    email,
    apartment_id,
    password,
    is_owner,
  } = req.body;
  const residentId = req.params.id;

  try {
    // --- 1. KIỂM TRA TRÙNG EMAIL (Trừ chính mình ra) ---
    if (email && email.trim() !== '') {
      const dupUser = await queryDB('SELECT id FROM users WHERE email = ?', [
        email,
      ]);
      if (dupUser.length > 0)
        return res
          .status(400)
          .json({ message: 'Email thuộc về Admin/Quản lý!' });

      const dupRes = await queryDB(
        'SELECT id FROM residents WHERE email = ? AND id != ?',
        [email, residentId],
      );
      if (dupRes.length > 0)
        return res
          .status(400)
          .json({ message: 'Email đã được dùng bởi cư dân khác!' });
    }

    // --- 2. CẬP NHẬT ---
    let sql, params;
    if (password && password.trim() !== '') {
      sql =
        'UPDATE residents SET full_name=?, username=?, phone=?, email=?, apartment_id=?, is_owner=?, password=? WHERE id=?';
      params = [
        full_name,
        username,
        phone,
        email,
        apartment_id,
        is_owner,
        password,
        residentId,
      ];
    } else {
      sql =
        'UPDATE residents SET full_name=?, username=?, phone=?, email=?, apartment_id=?, is_owner=? WHERE id=?';
      params = [
        full_name,
        username,
        phone,
        email,
        apartment_id,
        is_owner,
        residentId,
      ];
    }

    await queryDB(sql, params);

    if (Number(is_owner) === 1 && apartment_id) {
      await queryDB("UPDATE apartments SET status = 'da_ban' WHERE id = ?", [
        apartment_id,
      ]);
    }

    res.json({ success: true, message: 'Cập nhật thành công!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Mã cư dân bị trùng!' });
    return res.status(500).json({ message: err.message });
  }
});

app.delete('/api/residents/:id', (req, res) => {
  db.query('DELETE FROM residents WHERE id=?', [req.params.id], (err) =>
    res.json({ success: true }),
  );
});

// =======================================================
// 6. DỊCH VỤ & THIẾT LẬP GIÁ
// =======================================================
app.get('/api/services', (req, res) => {
  db.query('SELECT * FROM services', (err, r) => res.json(r));
});
app.post('/api/services', (req, res) => {
  const { name, price, unit } = req.body;
  const key = 'svc_' + Date.now();
  db.query(
    'INSERT INTO services (name, service_key, price, unit) VALUES (?, ?, ?, ?)',
    [name, key, price, unit],
    (e) => res.json({ success: true }),
  );
});
app.put('/api/services/:id', (req, res) => {
  const { name, price, unit } = req.body;
  db.query(
    'UPDATE services SET name=?, price=?, unit=? WHERE id=?',
    [name, price, unit, req.params.id],
    (e) => res.json({ success: true }),
  );
});
app.delete('/api/services/:id', (req, res) => {
  if ([1, 2, 3].includes(Number(req.params.id)))
    return res.status(400).json({ message: 'Không thể xóa dịch vụ gốc!' });
  db.query('DELETE FROM services WHERE id=?', [req.params.id], (e) =>
    res.json({ success: true }),
  );
});

// =======================================================
// 7. NHÂN SỰ (ADMIN/MANAGER) (ĐÃ CẬP NHẬT: CHẶN TRÙNG EMAIL)
// =======================================================
app.get('/api/users', (req, res) =>
  db.query('SELECT id, username, full_name, email, role FROM users', (err, r) =>
    res.json(r),
  ),
);

app.post('/api/users', async (req, res) => {
  const { username, password, full_name, email, role } = req.body;

  try {
    // KIỂM TRA EMAIL
    if (email) {
      const dupUser = await queryDB('SELECT id FROM users WHERE email = ?', [
        email,
      ]);
      if (dupUser.length > 0)
        return res.status(400).json({ message: 'Email này đã tồn tại!' });

      const dupRes = await queryDB('SELECT id FROM residents WHERE email = ?', [
        email,
      ]);
      if (dupRes.length > 0)
        return res
          .status(400)
          .json({ message: 'Email này đang được dùng bởi một Cư dân!' });
    }

    await queryDB(
      'INSERT INTO users (username, password, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
      [username, password, full_name, email, role],
    );
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ message: 'Tên đăng nhập đã tồn tại!' });
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { full_name, email, role, password } = req.body;
  const userId = req.params.id;

  try {
    // KIỂM TRA EMAIL (Trừ chính mình)
    if (email) {
      const dupUser = await queryDB(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, userId],
      );
      if (dupUser.length > 0)
        return res.status(400).json({ message: 'Email này đã tồn tại!' });

      const dupRes = await queryDB('SELECT id FROM residents WHERE email = ?', [
        email,
      ]);
      if (dupRes.length > 0)
        return res
          .status(400)
          .json({ message: 'Email này đang được dùng bởi Cư dân!' });
    }

    if (password) {
      await queryDB(
        'UPDATE users SET full_name=?, email=?, role=?, password=? WHERE id=?',
        [full_name, email, role, password, userId],
      );
    } else {
      await queryDB(
        'UPDATE users SET full_name=?, email=?, role=? WHERE id=?',
        [full_name, email, role, userId],
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/users/:id', (req, res) =>
  db.query('DELETE FROM users WHERE id=?', [req.params.id], (e) =>
    res.json({ success: true }),
  ),
);

// =======================================================
// 8. ĐĂNG KÝ DỊCH VỤ CHO CĂN HỘ
// =======================================================
app.get('/api/apartments/:id/services', (req, res) => {
  const sql = `SELECT s.id, s.name, s.price, s.unit, COALESCE(aps.quantity, 0) as quantity 
                 FROM services s 
                 LEFT JOIN apartment_services aps ON s.id = aps.service_id AND aps.apartment_id = ? 
                 WHERE s.service_key NOT IN ('dien', 'nuoc', 'quan_ly')`;
  db.query(sql, [req.params.id], (err, r) => res.json(r));
});
app.post('/api/apartments/:id/services', (req, res) => {
  const aptId = req.params.id;
  const services = req.body;
  db.query(
    'DELETE FROM apartment_services WHERE apartment_id = ?',
    [aptId],
    (err) => {
      const values = services
        .filter((s) => s.quantity > 0)
        .map((s) => [aptId, s.id, s.quantity]);
      if (values.length > 0)
        db.query(
          'INSERT INTO apartment_services (apartment_id, service_id, quantity) VALUES ?',
          [values],
          (e) => res.json({ success: true }),
        );
      else res.json({ success: true });
    },
  );
});

// =======================================================
// 9. CẤU HÌNH NGÂN HÀNG
// =======================================================
app.get('/api/payment-settings', (req, res) => {
  db.query('SELECT * FROM payment_settings LIMIT 1', (err, r) =>
    res.json(r.length > 0 ? r[0] : {}),
  );
});
app.post('/api/payment-settings', (req, res) => {
  const { bank_code, bank_name, account_number, account_holder } = req.body;
  db.query('SELECT * FROM payment_settings', (err, r) => {
    if (r.length === 0)
      db.query(
        'INSERT INTO payment_settings (bank_code, bank_name, account_number, account_holder) VALUES (?, ?, ?, ?)',
        [bank_code, bank_name, account_number, account_holder],
        (e) => res.json({ success: true }),
      );
    else
      db.query(
        'UPDATE payment_settings SET bank_code=?, bank_name=?, account_number=?, account_holder=? WHERE id=?',
        [bank_code, bank_name, account_number, account_holder, r[0].id],
        (e) => res.json({ success: true }),
      );
  });
});

// =======================================================
// 10. HÓA ĐƠN
// =======================================================
app.get('/api/bills', (req, res) => {
  const sql = `SELECT b.*, a.apartment_code, a.owner_name, a.status as apartment_status 
               FROM bills b 
               JOIN apartments a ON b.apartment_id = a.id 
               ORDER BY b.year DESC, b.month DESC, b.id DESC`;
  db.query(sql, (err, r) => res.json(r));
});
app.get('/api/my-bills/:aptId', (req, res) => {
  db.query(
    'SELECT * FROM bills WHERE apartment_id = ? ORDER BY id DESC',
    [req.params.aptId],
    (err, r) => res.json(r),
  );
});

app.post('/api/bills', async (req, res) => {
  const { apartment_id, month, year, elec_new, water_new } = req.body;
  try {
    const apt = (
      await queryDB('SELECT * FROM apartments WHERE id = ?', [apartment_id])
    )[0];
    const services = await queryDB('SELECT * FROM services');
    const prices = {};
    services.forEach((s) => (prices[s.service_key] = s.price));
    const prevBill = await queryDB(
      'SELECT elec_new, water_new FROM bills WHERE apartment_id = ? ORDER BY id DESC LIMIT 1',
      [apartment_id],
    );
    const elec_old = prevBill.length > 0 ? prevBill[0].elec_new : 0;
    const water_old = prevBill.length > 0 ? prevBill[0].water_new : 0;

    let details = [];
    let total = 0;
    const used_elec = elec_new - elec_old;
    total += used_elec * (prices['dien'] || 0);
    details.push({
      name: `Tiền điện (${used_elec} kWh)`,
      amount: used_elec * (prices['dien'] || 0),
    });
    const used_water = water_new - water_old;
    total += used_water * (prices['nuoc'] || 0);
    details.push({
      name: `Tiền nước (${used_water} m3)`,
      amount: used_water * (prices['nuoc'] || 0),
    });
    total += apt.area * (prices['quan_ly'] || 0);
    details.push({
      name: `Phí quản lý (${apt.area} m2)`,
      amount: apt.area * (prices['quan_ly'] || 0),
    });

    const otherServices = await queryDB(
      `SELECT s.name, s.price, aps.quantity FROM apartment_services aps JOIN services s ON aps.service_id = s.id WHERE aps.apartment_id = ?`,
      [apartment_id],
    );
    otherServices.forEach((s) => {
      const cost = s.price * s.quantity;
      details.push({ name: `${s.name} (SL: ${s.quantity})`, amount: cost });
      total += cost;
    });

    const sql = `INSERT INTO bills (apartment_id, month, year, elec_old, elec_new, water_old, water_new, total_amount, status, bill_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', ?)`;
    await queryDB(sql, [
      apartment_id,
      month,
      year,
      elec_old,
      elec_new,
      water_old,
      water_new,
      total,
      JSON.stringify(details),
    ]);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.put('/api/bills/:id/pay', (req, res) =>
  db.query(
    "UPDATE bills SET status = 'paid' WHERE id = ?",
    [req.params.id],
    (e) => res.json({ success: true }),
  ),
);
app.delete('/api/bills/:id', (req, res) =>
  db.query('DELETE FROM bills WHERE id = ?', [req.params.id], (e) =>
    res.json({ success: true }),
  ),
);

// =======================================================
// 11. YÊU CẦU & THÔNG BÁO
// =======================================================
app.get('/api/admin/requests', (req, res) => {
  const sql = `SELECT req.*, r.full_name, r.phone, a.apartment_code FROM requests req JOIN residents r ON req.resident_id = r.id JOIN apartments a ON r.apartment_id = a.id ORDER BY req.created_at DESC`;
  db.query(sql, (err, r) => res.json(r));
});
app.get('/api/my-requests/:residentId', (req, res) => {
  db.query(
    'SELECT * FROM requests WHERE resident_id = ? ORDER BY created_at DESC',
    [req.params.residentId],
    (err, r) => res.json(r),
  );
});

app.post('/api/requests', (req, res) => {
  const { resident_id, title, content } = req.body;

  if (!resident_id || !title || !content) {
    return res.status(400).json({ message: 'Thiếu thông tin yêu cầu!' });
  }

  const sqlInsert =
    "INSERT INTO requests (resident_id, title, content, status) VALUES (?, ?, ?, 'pending')";

  db.query(sqlInsert, [resident_id, title, content], (err, result) => {
    if (err) {
      console.error('Lỗi INSERT requests:', err);
      return res.status(500).json({ message: 'Lỗi lưu yêu cầu', error: err });
    }

    db.query(
      'SELECT full_name, apartment_id FROM residents WHERE id = ?',
      [resident_id],
      (err, resInfo) => {
        const rInfo = resInfo[0] || {};
        const residentName = rInfo.full_name || 'Cư dân';

        db.query(
          "SELECT id FROM users WHERE role IN ('admin', 'manager')",
          (err, staffList) => {
            if (!err && staffList.length > 0) {
              const notiValues = staffList.map((staff) => [
                'user',
                staff.id,
                '📩 Yêu cầu mới',
                `${residentName} vừa gửi yêu cầu: ${title}`,
              ]);

              const sqlNoti =
                'INSERT INTO notifications (type, target_id, title, message) VALUES ?';
              db.query(sqlNoti, [notiValues], (e) => {
                if (e) console.error('Lỗi tạo noti Admin:', e);
              });
            }
          },
        );
      },
    );

    res.json({ success: true, message: 'Gửi yêu cầu thành công!' });
  });
});

app.put('/api/requests/:id', (req, res) => {
  const { status, admin_response } = req.body;
  db.query(
    'SELECT * FROM requests WHERE id = ?',
    [req.params.id],
    (err, results) => {
      if (results.length > 0) {
        const reqData = results[0];
        db.query(
          'UPDATE requests SET status=?, admin_response=? WHERE id=?',
          [status, admin_response, req.params.id],
          () => {
            db.query(
              'INSERT INTO notifications (type, target_id, title, message) VALUES (?, ?, ?, ?)',
              [
                'resident',
                reqData.resident_id,
                'Cập nhật yêu cầu',
                `Admin đã trả lời: ${admin_response}`,
              ],
            );
            res.json({ success: true });
          },
        );
      }
    },
  );
});
app.delete('/api/requests/:id', (req, res) =>
  db.query('DELETE FROM requests WHERE id=?', [req.params.id], (e) =>
    res.json({ success: true }),
  ),
);

// POPUP THÔNG BÁO
app.get('/api/notifications', (req, res) => {
  const { type, id } = req.query;
  db.query(
    'SELECT * FROM notifications WHERE type = ? AND target_id = ? ORDER BY created_at DESC LIMIT 20',
    [type, id],
    (err, r) => res.json(r),
  );
});
app.put('/api/notifications/read', (req, res) => {
  const { type, id } = req.body;
  db.query(
    'UPDATE notifications SET is_read = 1 WHERE type = ? AND target_id = ?',
    [type, id],
    (e) => res.json({ success: true }),
  );
});

// =======================================================
// 12. THÔNG BÁO TOÀN DÂN
// =======================================================
app.get('/api/announcements', (req, res) => {
  db.query('SELECT * FROM announcements ORDER BY created_at DESC', (err, r) =>
    res.json(r),
  );
});
app.post('/api/announcements', (req, res) => {
  const { title, content } = req.body;
  db.query(
    'INSERT INTO announcements (title, content) VALUES (?, ?)',
    [title, content],
    (err) => {
      if (err) return res.status(500).json(err);
      db.query('SELECT id FROM residents', (err, residents) => {
        if (residents.length > 0) {
          const values = residents.map((r) => [
            'resident',
            r.id,
            title,
            content,
          ]);
          db.query(
            'INSERT INTO notifications (type, target_id, title, message) VALUES ?',
            [values],
          );
        }
      });
      res.json({ success: true });
    },
  );
});
app.delete('/api/announcements/:id', (req, res) => {
  db.query(
    'SELECT title FROM announcements WHERE id = ?',
    [req.params.id],
    (err, results) => {
      if (results.length === 0) return res.json({ success: true });
      const title = results[0].title;
      db.query(
        'DELETE FROM announcements WHERE id = ?',
        [req.params.id],
        () => {
          db.query(
            "DELETE FROM notifications WHERE title = ? AND type = 'resident'",
            [title],
            () => {
              res.json({ success: true });
            },
          );
        },
      );
    },
  );
});

// =======================================================
// 13. CHAT NỘI BỘ & PORTAL
// =======================================================
app.get('/api/internal-chat', (req, res) => {
  const sql = `SELECT c.*, u.full_name, u.role FROM internal_chats c JOIN users u ON c.sender_id = u.id ORDER BY c.created_at ASC`;
  db.query(sql, (err, r) => res.json(r));
});
app.post('/api/internal-chat', (req, res) => {
  const { sender_id, content } = req.body;
  db.query(
    'INSERT INTO internal_chats (sender_id, content) VALUES (?, ?)',
    [sender_id, content],
    (e) => res.json({ success: true }),
  );
});

app.get('/api/my-apartment-members/:aptId', (req, res) => {
  const sql =
    'SELECT full_name, phone, is_owner, username FROM residents WHERE apartment_id = ?';
  db.query(sql, [req.params.aptId], (err, r) => res.json(r));
});

app.delete('/api/internal-chat/:id', (req, res) => {
  db.query('DELETE FROM internal_chat WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// =======================================================
// 14. PUBLIC LANDING PAGE (KHÁCH VÃNG LAI)
// =======================================================

app.post('/api/guest/register', (req, res) => {
  const { full_name, phone, email, message } = req.body;
  const sql =
    'INSERT INTO guest_leads (full_name, phone, email, message) VALUES (?, ?, ?, ?)';
  db.query(sql, [full_name, phone, email, message], (err) => {
    if (err) return res.status(500).json(err);

    db.query(
      "SELECT id FROM users WHERE role IN ('admin', 'manager')",
      (err, staff) => {
        if (staff.length > 0) {
          const notiValues = staff.map((s) => [
            'user',
            s.id,
            '🎉 Khách hàng mới',
            `Khách ${full_name} (${phone}) vừa đăng ký tư vấn!`,
          ]);
          db.query(
            'INSERT INTO notifications (type, target_id, title, message) VALUES ?',
            [notiValues],
          );
        }
      },
    );

    res.json({ success: true });
  });
});

app.get('/api/guest/leads', (req, res) => {
  db.query('SELECT * FROM guest_leads ORDER BY created_at DESC', (err, r) =>
    res.json(r),
  );
});

app.put('/api/guest/leads/:id', (req, res) => {
  const { status } = req.body;
  db.query(
    'UPDATE guest_leads SET status = ? WHERE id = ?',
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ success: true });
    },
  );
});

app.delete('/api/guest/leads/:id', (req, res) => {
  db.query('DELETE FROM guest_leads WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ success: true });
  });
});

// --- API CHO PORTAL THÔNG TIN ---

app.get('/api/apartments/:id', (req, res) => {
  const sql = 'SELECT * FROM apartments WHERE id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    if (result.length === 0)
      return res.status(404).json({ message: 'Không tìm thấy' });
    res.json(result[0]);
  });
});

app.get('/api/apartments/:id/members', (req, res) => {
  const sql = 'SELECT * FROM residents WHERE apartment_id = ?';
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post('/api/change-password', (req, res) => {
  const { id, oldPassword, newPassword } = req.body;
  const sqlCheck = 'SELECT * FROM residents WHERE id = ? AND password = ?';

  db.query(sqlCheck, [id, oldPassword], (err, result) => {
    if (err) return res.status(500).json(err);

    if (result.length === 0) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng!' });
    }

    const sqlUpdate = 'UPDATE residents SET password = ? WHERE id = ?';
    db.query(sqlUpdate, [newPassword, id], (err, result) => {
      if (err) return res.status(500).json(err);
      res.json({ message: 'Đổi mật khẩu thành công!' });
    });
  });
});

//API Upload biên lai
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'bill_' + Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

app.use('/uploads', express.static('uploads'));

app.post('/api/bills/upload', upload.single('image'), (req, res) => {
  const { bill_id } = req.body;
  const imagePath = req.file ? req.file.filename : null;

  if (!imagePath) return res.status(400).json({ message: 'Chưa chọn ảnh!' });

  const sql =
    "UPDATE bills SET payment_image = ?, status = 'pending' WHERE id = ?";
  db.query(sql, [imagePath, bill_id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Upload thành công! Đang chờ BQL duyệt.' });
  });
});

app.put('/api/bills/approve/:id', (req, res) => {
  const sql = "UPDATE bills SET status = 'paid' WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Đã duyệt hóa đơn thành công!' });
  });
});

app.put('/api/bills/reject/:id', (req, res) => {
  const sql =
    "UPDATE bills SET status = 'unpaid', payment_image = NULL WHERE id = ?";
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: 'Đã từ chối hóa đơn!' });
  });
});

// KHỞI CHẠY SERVER
const PORT = process.env.PORT || 5000;
// Thêm '0.0.0.0' để cho phép kết nối từ bên ngoài thay vì chỉ nội bộ (localhost)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server đang chạy tại cổng: ${PORT}`);
  console.log(`🔗 Truy cập qua IP: http://103.82.195.119:${PORT}`);
});

// --- API AI ĐỀ XUẤT (GEMINI) ---
app.post('/api/ai-recommend', (req, res) => {
  const { budget, members, preferences } = req.body;
  const maxBudget = Number(budget) * 1.2;
  const sql =
    "SELECT * FROM apartments WHERE status = 'con_trong' AND price <= ?";

  db.query(sql, [maxBudget], async (err, apartments) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Lỗi Database' });
    }

    if (apartments.length === 0) return res.json([]);

    try {
      const aptListText = apartments
        .map(
          (a) =>
            `- Mã: ${a.apartment_code}, Giá: ${a.price}, Tầng: ${a.floor}, DT: ${a.area}m2, Hướng: ${a.direction}, Mô tả: ${a.description}`,
        )
        .join('\n');

      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
                 Bạn là môi giới BĐS chuyên nghiệp.
                 Khách hàng cần tìm căn hộ với tiêu chí:
                 - Ngân sách: ${budget} VNĐ
                 - Số người ở: ${members}
                 - Mong muốn: ${preferences}

                 Danh sách căn hộ hiện có (Kèm mô tả chi tiết):
                 ${aptListText}

                 Yêu cầu BẮT BUỘC:
                 1. Chọn ra tối đa 3 căn hộ phù hợp nhất.
                 2. Trả về kết quả CHỈ là một JSON Array hợp lệ.
                 3. Cấu trúc JSON:
                 [
                     {
                         "apartment_code": "Mã căn",
                         "match_score": 95,
                         "reason": "Giải thích ngắn gọn"
                     }
                 ]
             `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text.replace(/```json|```/g, '').trim();

      const recommendations = JSON.parse(text);

      const finalResult = recommendations
        .map((rec) => {
          const original = apartments.find(
            (a) => a.apartment_code === rec.apartment_code,
          );
          if (original) {
            return { ...original, ...rec };
          }
          return null;
        })
        .filter((item) => item !== null);

      res.json(finalResult);
    } catch (error) {
      console.error('Lỗi AI:', error);
      res.json(apartments.slice(0, 3));
    }
  });
});

// --- CẤU HÌNH GỬI MAIL ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ducthagcontact906@gmail.com',
    pass: 'dugb axxl nsrp loaq',
  },
});

// API QUÊN MẬT KHẨU
app.post('/api/forgot-password', async (req, res) => {
  const { username, email } = req.body;

  try {
    // 1. Tìm trong bảng Users (Admin/QL)
    let user = (
      await queryDB('SELECT * FROM users WHERE username = ? AND email = ?', [
        username,
        email,
      ])
    )[0];
    let table = 'users';

    // 2. Nếu không thấy, tìm trong Residents (Cư dân)
    if (!user) {
      user = (
        await queryDB(
          'SELECT * FROM residents WHERE username = ? AND email = ?',
          [username, email],
        )
      )[0];
      table = 'residents';
    }

    // 3. Nếu vẫn không thấy -> Báo lỗi
    if (!user) {
      return res.json({
        success: false,
        message: 'Thông tin tài khoản hoặc email không chính xác!',
      });
    }

    // 4. Reset mật khẩu về '123456'
    await queryDB(`UPDATE ${table} SET password = '123456' WHERE id = ?`, [
      user.id,
    ]);

    // 5. Gửi email thông báo
    const mailOptions = {
      from: 'QUẢN LÝ CHUNG CƯ <no-reply>',
      to: email,
      subject: '🔒 CẤP LẠI MẬT KHẨU MỚI',
      html: `
                 <h3>Xin chào ${user.full_name},</h3>
                 <p>Chúng tôi đã nhận được yêu cầu khôi phục mật khẩu của bạn.</p>
                 <p>Mật khẩu của bạn đã được reset về mặc định: <b>123456</b></p>
                 <p>Vui lòng đăng nhập và đổi mật khẩu ngay lập tức.</p>
                 <hr>
                 <small>BQL Chung cư Grand Marina</small>
             `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.json({
          success: false,
          message: 'Lỗi gửi email: ' + error.message,
        });
      }
      res.json({
        success: true,
        message: 'Đã gửi mật khẩu mới về email của bạn!',
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
