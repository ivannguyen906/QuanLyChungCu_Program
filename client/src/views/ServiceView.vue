<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
// Import Component Thông báo
import NotificationToast from '../components/NotificationToast.vue';

const router = useRouter();
const services = ref([]);
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));
const form = ref({ name: '', price: 0, unit: '' });

// --- LOGIC FETCH DATA (GIỮ NGUYÊN) ---
const fetchServices = async () => {
  try {
    const res = await axios.get(
      'http://http://103.82.195.119:5000/api/services',
    );
    services.value = res.data;
  } catch (e) {}
};

const openEdit = (s) => {
  isEditing.value = true;
  currentId.value = s.id;
  form.value = { ...s };
  showModal.value = true;
};

const handleSave = async () => {
  try {
    if (isEditing.value)
      await axios.put(
        `http://http://103.82.195.119:5000/api/services/${currentId.value}`,
        form.value,
      );
    else
      await axios.post(
        'http://http://103.82.195.119:5000/api/services',
        form.value,
      );

    showModal.value = false;
    fetchServices();
  } catch (e) {
    alert(e.response?.data?.message);
  }
};

const handleDelete = async (id, name) => {
  if (confirm(`Xóa dịch vụ ${name}?`)) {
    try {
      await axios.delete(
        `http://http://103.82.195.119:5000/api/services/${id}`,
      );
      fetchServices();
    } catch (e) {
      alert(e.response?.data?.message);
    }
  }
};

const formatMoney = (v) => Number(v).toLocaleString('vi-VN') + ' đ';

const logout = () => {
  localStorage.removeItem('user_info');
  router.push('/login');
};

onMounted(() => {
  if (!user.value.username) router.push('/login');
  fetchServices();
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
        <router-link to="/residents" class="nav-item">👥 Cư dân</router-link>
        <router-link to="/leads" class="nav-item">📞 Khách hàng</router-link>
        <router-link to="/bills" class="nav-item">📄 Hóa đơn</router-link>
        <router-link to="/services" class="nav-item active"
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
          <h1>Bảng giá Dịch vụ</h1>
          <p>Thiết lập đơn giá cho các loại phí sinh hoạt</p>
        </div>

        <div class="header-actions">
          <NotificationToast role="user" :userId="user.id" />

          <button
            @click="
              showModal = true;
              isEditing = false;
              form = { name: '', price: 0, unit: '' };
            "
            class="btn-primary"
          >
            + Thêm Dịch Vụ
          </button>
        </div>
      </header>

      <div class="content-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tên dịch vụ</th>
              <th>Mã (Key)</th>
              <th>Đơn giá</th>
              <th>Đơn vị tính</th>
              <th style="text-align: right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in services" :key="s.id">
              <td>
                <strong style="color: var(--dark)">{{ s.name }}</strong>
              </td>
              <td style="font-family: monospace; color: #64748b">
                {{ s.service_key }}
              </td>
              <td
                style="color: var(--primary); font-weight: 700; font-size: 15px"
              >
                {{ formatMoney(s.price) }}
              </td>
              <td>{{ s.unit }}</td>
              <td style="text-align: right">
                <div class="action-group">
                  <button
                    @click="openEdit(s)"
                    class="btn-icon edit"
                    title="Sửa"
                  >
                    ✏️
                  </button>
                  <button
                    v-if="user.role === 'admin'"
                    @click="handleDelete(s.id, s.name)"
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
          <h3>{{ isEditing ? 'Cập nhật Giá Dịch Vụ' : 'Thêm Dịch Vụ Mới' }}</h3>
          <button @click="showModal = false" class="close-btn">×</button>
        </div>

        <div class="form-body">
          <div class="form-group">
            <label>Tên dịch vụ</label>
            <input v-model="form.name" placeholder="VD: Phí gửi xe máy..." />
          </div>

          <div class="form-group">
            <label>Đơn vị tính</label>
            <input
              v-model="form.unit"
              placeholder="VD: chiếc/tháng, kWh, m3..."
            />
          </div>

          <div class="form-group">
            <label>Đơn giá (VNĐ)</label>
            <input
              type="number"
              v-model="form.price"
              placeholder="Nhập số tiền..."
            />
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
.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-family: var(--font-body);
  box-sizing: border-box;
}
.form-group input:focus {
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
