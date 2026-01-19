<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
// Import Component Thông báo
import NotificationToast from '../components/NotificationToast.vue';

const router = useRouter();
const requests = ref([]);
const showModal = ref(false);
const currentReq = ref(null);
const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));
const form = ref({ status: '', admin_response: '' });

// --- LOGIC FETCH DATA (GIỮ NGUYÊN) ---
const fetchRequests = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/admin/requests');
    requests.value = res.data;
  } catch (e) {}
};

const openProcess = (req) => {
  currentReq.value = req;
  form.value = { status: req.status, admin_response: req.admin_response || '' };
  showModal.value = true;
};

const handleUpdate = async () => {
  try {
    await axios.put(
      `http://localhost:3000/api/requests/${currentReq.value.id}`,
      form.value,
    );
    showModal.value = false;
    fetchRequests();
    alert('Đã cập nhật!');
  } catch (e) {
    alert('Lỗi update');
  }
};

const handleDelete = async (id) => {
  if (confirm('Xóa?')) {
    await axios.delete(`http://localhost:3000/api/requests/${id}`);
    fetchRequests();
  }
};

const statusText = (s) =>
  ({
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    done: 'Hoàn thành',
    rejected: 'Từ chối',
  })[s];

const logout = () => {
  localStorage.removeItem('user_info');
  router.push('/login');
};

onMounted(() => {
  if (!user.value.username) router.push('/login');
  fetchRequests();
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
        <router-link to="/services" class="nav-item"
          >💲 Thiết lập giá</router-link
        >
        <router-link to="/requests" class="nav-item active"
          >🔔 Yêu cầu</router-link
        >
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
          <h1>Tiếp nhận Yêu cầu</h1>
          <p>Danh sách phản ánh, kiến nghị từ cư dân</p>
        </div>

        <div class="header-actions">
          <NotificationToast role="user" :userId="user.id" />
        </div>
      </header>

      <div class="content-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Phòng</th>
              <th>Người gửi</th>
              <th>Nội dung yêu cầu</th>
              <th>Trạng thái</th>
              <th>Phản hồi của BQL</th>
              <th style="text-align: right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in requests" :key="r.id">
              <td>
                <span class="badge code-badge">{{ r.apartment_code }}</span>
              </td>
              <td>
                <div style="font-weight: 600">{{ r.full_name }}</div>
                <small style="color: #64748b">{{ r.phone }}</small>
              </td>
              <td style="max-width: 300px">
                <div style="font-weight: 600; color: var(--dark)">
                  {{ r.title }}
                </div>
                <div style="color: #64748b; font-size: 13px; margin-top: 4px">
                  {{ r.content }}
                </div>
              </td>
              <td>
                <span :class="['status-badge', r.status]">{{
                  statusText(r.status)
                }}</span>
              </td>
              <td style="color: #64748b; font-style: italic; font-size: 13px">
                {{ r.admin_response || '---' }}
              </td>
              <td style="text-align: right">
                <div class="action-group">
                  <button
                    @click="openProcess(r)"
                    class="btn-icon edit"
                    title="Xử lý"
                  >
                    💬
                  </button>
                  <button
                    v-if="user.role === 'admin'"
                    @click="handleDelete(r.id)"
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
          <h3>Xử lý yêu cầu: {{ currentReq.title }}</h3>
          <button @click="showModal = false" class="close-btn">×</button>
        </div>

        <div class="form-body">
          <div class="req-info">
            <strong>Nội dung cư dân gửi:</strong>
            <p>{{ currentReq.content }}</p>
          </div>

          <div class="form-group">
            <label>Trạng thái xử lý</label>
            <select v-model="form.status">
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang thực hiện</option>
              <option value="done">Hoàn thành</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>

          <div class="form-group">
            <label>Phản hồi cho cư dân</label>
            <textarea
              v-model="form.admin_response"
              rows="4"
              placeholder="Nhập nội dung phản hồi..."
            ></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showModal = false" class="btn-outline">Hủy bỏ</button>
          <button @click="handleUpdate" class="btn-primary">Cập nhật</button>
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
  vertical-align: top;
  color: #334155;
  transition: 0.2s;
}
.data-table tr:hover td {
  background: #f8fafc;
}

/* BADGES */
.badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  display: inline-block;
}
.code-badge {
  background: #fff7ed;
  color: #ea580c;
  font-family: monospace;
}

.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}
.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
}
.status-badge.processing {
  background: #dbeafe;
  color: #2563eb;
}
.status-badge.done {
  background: #dcfce7;
  color: #16a34a;
}
.status-badge.rejected {
  background: #fee2e2;
  color: #dc2626;
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
  width: 500px;
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
  gap: 20px;
}
.req-info {
  background: #f8fafc;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  font-size: 14px;
  color: #334155;
}
.req-info p {
  margin: 5px 0 0 0;
  color: #64748b;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-family: var(--font-body);
  box-sizing: border-box;
}
.form-group select:focus,
.form-group textarea:focus {
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
</style>
