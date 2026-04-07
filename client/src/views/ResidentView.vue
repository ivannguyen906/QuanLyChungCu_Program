<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const residents = ref([]);
const apartments = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));

const searchQuery = ref('');
const showPass = ref({});

// CẬP NHẬT FORM: Thêm trường email
const form = ref({
  full_name: '',
  username: '',
  phone: '',
  email: '', // <--- Thêm trường này
  apartment_id: '',
  is_owner: 0,
  password: '',
});

// --- LOGIC FETCH DATA ---
const fetchData = async () => {
  try {
    const [resRes, resApt] = await Promise.all([
      axios.get('http://http://103.82.195.119:5000/api/residents'),
      axios.get('http://http://103.82.195.119:5000/api/apartments'),
    ]);
    residents.value = resRes.data;
    apartments.value = resApt.data;
  } catch (e) {}
};

const formatAptStatus = (status) => {
  const map = {
    chua_ban: 'Còn trống',
    dat_coc: 'Đã đặt cọc',
    da_ban: 'Đã bán',
    cho_thue: 'Đang thuê',
  };
  return map[status] || '---';
};

// --- LOGIC LỌC ---
const filteredResidents = computed(() => {
  if (!searchQuery.value) return residents.value;
  const lower = searchQuery.value.toLowerCase();
  return residents.value.filter(
    (r) =>
      r.full_name.toLowerCase().includes(lower) ||
      (r.username && r.username.toLowerCase().includes(lower)) ||
      (r.email && r.email.toLowerCase().includes(lower)) || // Tìm theo email
      (r.apartment_code && r.apartment_code.toLowerCase().includes(lower)) ||
      (r.phone && r.phone.includes(lower)),
  );
});

// --- LOGIC MODAL ---
const openAdd = () => {
  isEditing.value = false;
  // Tạo mã ngẫu nhiên cho tiện (DC + số)
  const randomCode = 'DC' + Math.floor(Math.random() * 9000 + 1000);

  form.value = {
    full_name: '',
    username: randomCode,
    phone: '',
    email: '', // Reset email
    apartment_id: '',
    is_owner: 0,
    password: '',
  };
  showModal.value = true;
};

const openEdit = (r) => {
  isEditing.value = true;
  currentId.value = r.id;
  // Map dữ liệu vào form
  form.value = { ...r, password: r.password || '' };
  showModal.value = true;
};

const handleSave = async () => {
  if (!form.value.username) return alert('Vui lòng nhập Mã cư dân (VD: DC1)');

  try {
    if (isEditing.value)
      await axios.put(
        `http://http://103.82.195.119:5000/api/residents/${currentId.value}`,
        form.value,
      );
    else
      await axios.post(
        'http://http://103.82.195.119:5000/api/residents',
        form.value,
      );

    showModal.value = false;
    fetchData();
    alert('Lưu dữ liệu thành công!');
  } catch (e) {
    alert(e.response?.data?.message || 'Lỗi lưu dữ liệu');
  }
};

const handleDelete = async (id) => {
  if (confirm('Bạn có chắc chắn muốn xóa cư dân này?')) {
    await axios.delete(`http://http://103.82.195.119:5000/api/residents/${id}`);
    fetchData();
  }
};

const togglePass = (id) => {
  showPass.value[id] = !showPass.value[id];
};

const logout = () => {
  localStorage.removeItem('user_info');
  router.push('/login');
};

onMounted(() => {
  if (!user.value.username) router.push('/login');
  fetchData();
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
        <router-link v-if="user.role === 'admin'" to="/staff" class="nav-item"
          >🛡️ Nhân sự</router-link
        >
        <router-link to="/residents" class="nav-item active"
          >👥 Cư dân</router-link
        >
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
          <h1>Quản lý Cư dân</h1>
          <p>Danh sách cư dân và tài khoản cổng thông tin</p>
        </div>

        <div class="header-actions">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              placeholder="Tìm Mã DC, Phòng, Tên, Email..."
            />
          </div>
          <button @click="openAdd" class="btn-primary">+ Thêm Cư Dân</button>
        </div>
      </header>

      <div class="content-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>User (Mã)</th>
              <th>Email</th>
              <th>Mật khẩu</th>
              <th>Căn hộ</th>
              <th>SĐT</th>
              <th>Vai trò</th>
              <th style="text-align: right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in filteredResidents" :key="r.id">
              <td>
                <strong style="color: var(--dark)">{{ r.full_name }}</strong>
              </td>
              <td
                style="
                  color: var(--primary);
                  font-weight: 700;
                  font-family: monospace;
                "
              >
                {{ r.username }}
              </td>
              <td style="color: #64748b; font-size: 13px">
                {{ r.email || '---' }}
              </td>
              <td>
                <div class="pass-cell">
                  <span>{{ showPass[r.id] ? r.password : '••••••' }}</span>
                  <button
                    @click="togglePass(r.id)"
                    class="btn-eye"
                    title="Hiện mật khẩu"
                  >
                    {{ showPass[r.id] ? '🙈' : '👁️' }}
                  </button>
                </div>
              </td>
              <td>
                <span class="badge code-badge">{{
                  r.apartment_code || '---'
                }}</span>
              </td>
              <td style="font-family: monospace">{{ r.phone }}</td>
              <td>
                <span :class="['badge', r.is_owner ? 'owner' : 'member']">
                  {{ r.is_owner ? 'Chủ hộ' : 'Thành viên' }}
                </span>
              </td>
              <td style="text-align: right">
                <div class="action-group">
                  <button
                    @click="openEdit(r)"
                    class="btn-icon edit"
                    title="Sửa"
                  >
                    ✏️
                  </button>
                  <button
                    @click="handleDelete(r.id)"
                    class="btn-icon delete"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredResidents.length === 0">
              <td colspan="8" class="empty-text">Không tìm thấy cư dân nào</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h3>
            {{ isEditing ? 'Cập nhật Thông tin Cư dân' : 'Thêm Cư dân Mới' }}
          </h3>
          <button @click="showModal = false" class="close-btn">×</button>
        </div>

        <div class="form-body">
          <div class="form-group">
            <label
              >Mã cư dân (Tài khoản đăng nhập)
              <span style="color: red">*</span></label
            >
            <input
              v-model="form.username"
              placeholder="VD: DC1, DC2..."
              :disabled="isEditing"
            />
          </div>

          <div class="form-group">
            <label>Họ và tên</label>
            <input v-model="form.full_name" placeholder="VD: Nguyễn Văn A" />
          </div>

          <div class="form-group">
            <label>Email (Nhận mã OTP/Mật khẩu)</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="VD: abc@gmail.com"
            />
          </div>

          <div class="form-group">
            <label>Số điện thoại</label>
            <input v-model="form.phone" placeholder="VD: 090..." />
          </div>

          <div class="form-group">
            <label>Thuộc Căn hộ</label>
            <select v-model="form.apartment_id">
              <option value="">-- Chọn căn hộ --</option>
              <option v-for="a in apartments" :key="a.id" :value="a.id">
                {{ a.apartment_code }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Mật khẩu</label>
            <input
              type="text"
              v-model="form.password"
              placeholder="Mặc định: 123456"
            />
          </div>

          <div class="form-group row">
            <label class="switch">
              <input
                type="checkbox"
                v-model="form.is_owner"
                :true-value="1"
                :false-value="0"
              />
              <span class="slider round"></span>
            </label>
            <span class="label-text">Là Chủ hộ đứng tên</span>
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
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}
.search-box input {
  padding: 12px 12px 12px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 280px;
  outline: none;
  transition: 0.2s;
  font-family: var(--font-body);
}
.search-box input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}
.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
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

/* BADGES & STATUS */
.badge {
  padding: 6px 12px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}
.badge.owner {
  background: #dcfce7;
  color: #16a34a;
  border: 1px solid #bbf7d0;
} /* Chủ hộ - Xanh lá */
.badge.member {
  background: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
} /* Thành viên - Xám */
.badge.code-badge {
  background: #fff7ed;
  color: #ea580c;
  font-weight: 700;
} /* Mã căn hộ - Cam nhạt */

.pass-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: monospace;
  background: #f8fafc;
  padding: 4px 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  width: fit-content;
}
.btn-eye {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.5;
  transition: 0.2s;
}
.btn-eye:hover {
  opacity: 1;
}

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

/* Switch Button cho checkbox */
.form-group.row {
  flex-direction: row;
  align-items: center;
  gap: 15px;
  margin-top: 5px;
}
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 20px;
}
.slider:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}
input:checked + .slider {
  background-color: var(--primary);
}
input:checked + .slider:before {
  transform: translateX(20px);
}
.label-text {
  font-weight: 600;
  color: var(--dark);
  font-size: 14px;
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
