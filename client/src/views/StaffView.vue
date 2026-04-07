<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
// Import Component Thông báo nếu có
// import NotificationToast from '../components/NotificationToast.vue';

const router = useRouter();
const users = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));

// CẬP NHẬT FORM: Thêm trường email
const form = ref({
  username: '',
  password: '',
  full_name: '',
  email: '', // <--- Thêm trường này
  role: 'manager',
});

// --- LOGIC FETCH DATA ---
const fetchUsers = async () => {
  try {
    const res = await axios.get('http://103.82.195.119:5000/api/users');
    users.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

// --- LOGIC MODAL ---
const openEdit = (u) => {
  isEditing.value = true;
  currentId.value = u.id;
  // Copy dữ liệu cũ, bỏ mật khẩu để tránh lộ
  form.value = { ...u, password: '' };
  showModal.value = true;
};

const openAdd = () => {
  isEditing.value = false;
  form.value = {
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'manager',
  };
  showModal.value = true;
};

// --- LOGIC LƯU ---
const handleSave = async () => {
  try {
    if (!form.value.username || !form.value.full_name)
      return alert('Vui lòng điền đủ thông tin!');

    if (isEditing.value) {
      // Update
      await axios.put(
        `http://103.82.195.119:5000/api/users/${currentId.value}`,
        form.value,
      );
    } else {
      // Create
      if (!form.value.password) return alert('Vui lòng nhập mật khẩu!');
      await axios.post('http://103.82.195.119:5000/api/users', form.value);
    }

    showModal.value = false;
    fetchUsers();
    alert(isEditing.value ? 'Đã cập nhật!' : 'Đã thêm mới!');
  } catch (e) {
    alert('Lỗi: ' + (e.response?.data?.message || e.message));
  }
};

// --- LOGIC XÓA ---
const handleDelete = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) {
    try {
      await axios.delete(`http://103.82.195.119:5000/api/users/${id}`);
      fetchUsers();
    } catch (e) {
      alert('Lỗi xóa');
    }
  }
};

const logout = () => {
  localStorage.removeItem('user_info');
  router.push('/login');
};

const roleName = (r) =>
  r === 'admin' ? 'Quản trị viên (Super)' : 'Quản lý (Manager)';

onMounted(() => {
  if (!user.value.username) return router.push('/login');
  if (user.value.role !== 'admin') {
    alert('Bạn không có quyền truy cập trang Nhân sự!');
    return router.push('/dashboard');
  }
  fetchUsers();
});
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo-icon">⚜️</div>
        <div class="brand-text">
          <h3>GRAND MARINA</h3>
          <small>Admin Dashboard</small>
        </div>
      </div>

      <nav class="nav-menu">
        <router-link to="/dashboard" class="nav-item">🏠 Tổng quan</router-link>
        <router-link to="/apartments" class="nav-item">🏢 Căn hộ</router-link>
        <router-link
          v-if="user.role === 'admin'"
          to="/staff"
          class="nav-item active"
          >🛡️ Nhân sự</router-link
        >
        <router-link to="/residents" class="nav-item">👥 Cư dân</router-link>
        <router-link to="/leads" class="nav-item">📞 Khách hàng</router-link>
        <router-link to="/bills" class="nav-item">📄 Hóa đơn</router-link>
        <router-link to="/services" class="nav-item"
          >💲 Thiết lập giá</router-link
        >
        <router-link to="/requests" class="nav-item">🔔 Yêu cầu</router-link>
        <router-link to="/chat" class="nav-item">💬 Chat Nội bộ</router-link>
        <router-link to="/announcements" class="nav-item"
          >📢 Thông báo chung</router-link
        >
      </nav>

      <div class="user-profile">
        <div class="avatar">{{ user.full_name?.charAt(0) }}</div>
        <div class="info">
          <strong>{{ user.full_name }}</strong>
          <small>{{
            user.role === 'admin' ? 'Quản trị viên' : 'Quản lý'
          }}</small>
        </div>
        <button @click="logout" class="btn-logout" title="Đăng xuất">↪</button>
      </div>
    </aside>

    <main class="main-content">
      <header class="header">
        <div>
          <h1>Quản lý Nhân sự</h1>
          <p>Danh sách tài khoản truy cập hệ thống</p>
        </div>

        <div class="header-actions">
          <button @click="openAdd" class="btn-primary">+ Thêm Nhân Viên</button>
        </div>
      </header>

      <div class="content-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tài khoản</th>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th style="text-align: right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td class="code">{{ u.username }}</td>
              <td style="font-weight: 500">{{ u.full_name }}</td>
              <td style="color: #64748b; font-size: 13px">
                {{ u.email || '---' }}
              </td>
              <td>
                <span :class="['badge', u.role]">{{ roleName(u.role) }}</span>
              </td>
              <td style="text-align: right">
                <div class="action-group">
                  <button
                    @click="openEdit(u)"
                    class="btn-icon edit"
                    title="Sửa"
                  >
                    ✏️
                  </button>
                  <button
                    v-if="u.id !== user.id"
                    @click="handleDelete(u.id)"
                    class="btn-icon delete"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Cập nhật Nhân viên' : 'Thêm Nhân viên Mới' }}</h3>
          <button @click="showModal = false" class="close-btn">×</button>
        </div>

        <div class="form-body">
          <div class="form-group">
            <label>Tên đăng nhập (Username)</label>
            <input
              v-model="form.username"
              :disabled="isEditing"
              placeholder="VD: admin, manager1..."
            />
          </div>

          <div class="form-group">
            <label>Họ và tên</label>
            <input v-model="form.full_name" placeholder="VD: Nguyễn Văn A" />
          </div>

          <div class="form-group">
            <label>Email (Để nhận mật khẩu khi quên)</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="VD: abc@gmail.com"
            />
          </div>

          <div class="form-group">
            <label
              >Mật khẩu {{ isEditing ? '(Để trống nếu không đổi)' : '' }}</label
            >
            <input
              type="password"
              v-model="form.password"
              placeholder="******"
            />
          </div>

          <div class="form-group">
            <label>Phân quyền</label>
            <select v-model="form.role">
              <option value="manager">Quản lý (Manager)</option>
              <option value="admin">Quản trị viên (Super Admin)</option>
            </select>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showModal = false" class="btn-outline">Hủy bỏ</button>
          <button @click="handleSave" class="btn-primary">Lưu thông tin</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* --- 1. LAYOUT CHUNG & SIDEBAR (LUXURY STYLE) --- */
.app-layout {
  display: flex;
  height: 100vh;
  background: var(--light);
  color: var(--dark);
  font-family: 'Inter', sans-serif;
}

.sidebar {
  width: 260px;
  background: var(--dark);
  color: var(--white);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.05);
}
.brand {
  padding: 30px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.logo-icon {
  font-size: 24px;
  color: var(--primary);
}
.brand-text h3 {
  color: var(--white);
  margin: 0;
  font-size: 16px;
  letter-spacing: 1px;
}
.brand-text small {
  color: var(--gray);
  font-family: var(--font-body);
}

.nav-menu {
  flex: 1;
  padding: 20px 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  overflow-y: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 15px;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  transition: 0.2s;
}
.nav-item:hover {
  background: var(--dark-light);
  color: var(--white);
}
.nav-item.active {
  background: linear-gradient(90deg, var(--primary) 0%, #b5952f 100%);
  color: var(--dark);
  font-weight: 600;
}

.user-profile {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  background: #020617;
}
.avatar {
  width: 36px;
  height: 36px;
  background: var(--dark-light);
  color: var(--primary);
  border: 1px solid var(--primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.info strong {
  display: block;
  font-size: 14px;
  color: var(--white);
}
.info small {
  font-size: 11px;
  color: var(--gray);
}
.btn-logout {
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  font-size: 18px;
}

/* --- 2. MAIN CONTENT --- */
.main-content {
  flex: 1;
  padding: 30px 40px;
  overflow-y: auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 30px;
}
.header h1 {
  font-size: 28px;
  margin: 0;
  font-family: var(--font-heading);
  color: var(--dark);
}
.header p {
  color: var(--gray);
  margin: 5px 0 0 0;
}

.header-actions {
  display: flex;
  gap: 15px;
  align-items: center;
}

.btn-primary {
  background: linear-gradient(180deg, var(--primary) 0%, #b5952f 100%);
  color: var(--white);
  border: none;
  padding: 10px 25px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}
.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* --- 3. DATA TABLE (LUXURY STYLE) --- */
.content-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.data-table th {
  text-align: left;
  padding: 15px;
  color: var(--dark);
  border-bottom: 2px solid #f1f5f9;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 15px;
}
.data-table td {
  padding: 15px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #334155;
  transition: 0.2s;
}
.data-table tr:hover td {
  background: #f8fafc;
}

.code {
  color: var(--primary);
  font-weight: 700;
  font-family: monospace;
  font-size: 14px;
}

/* BADGES */
.badge {
  padding: 6px 12px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}
.badge.admin {
  background: #fef9c3;
  color: #ca8a04;
  border: 1px solid #fde047;
} /* Vàng Gold */
.badge.manager {
  background: #dbeafe;
  color: #2563eb;
  border: 1px solid #bfdbfe;
} /* Xanh Dương */

/* ACTION BUTTONS */
.action-group {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}
.btn-icon.edit {
  background: #eff6ff;
  color: #2563eb;
}
.btn-icon.delete {
  background: #fef2f2;
  color: #ef4444;
}
.btn-icon:hover {
  transform: scale(1.1);
}

/* --- 4. MODAL (POPUP) --- */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: white;
  width: 450px;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  padding: 20px 25px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--dark);
}
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
}

.form-body {
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-family: var(--font-body);
  box-sizing: border-box;
}
.form-group input:focus,
.form-group select:focus {
  border-color: var(--primary);
  outline: none;
}

.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #f8fafc;
  border-radius: 0 0 12px 12px;
}
.btn-outline {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
.btn-outline:hover {
  background: #f1f5f9;
}
</style>
