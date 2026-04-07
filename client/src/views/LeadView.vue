<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
// Import Component Thông báo
import NotificationToast from '../components/NotificationToast.vue';

const router = useRouter();
const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));

// --- LOGIC CŨ (GIỮ NGUYÊN) ---
const leads = ref([]);
const stats = ref({ new: 0, contacted: 0 });

const fetchLeads = async () => {
  try {
    const res = await axios.get(
      'http://http://103.82.195.119:5000/api/guest/leads',
    );
    leads.value = res.data;
    // Tính thống kê
    stats.value.new = leads.value.filter((l) => l.status === 'new').length;
    stats.value.contacted = leads.value.filter(
      (l) => l.status === 'contacted',
    ).length;
  } catch (e) {}
};

const updateStatus = async (lead, newStatus) => {
  try {
    await axios.put(
      `http://http://103.82.195.119:5000/api/guest/leads/${lead.id}`,
      {
        status: newStatus,
      },
    );
    lead.status = newStatus;
    fetchLeads(); // Cập nhật lại số liệu
  } catch (e) {
    alert('Lỗi cập nhật');
  }
};

const formatTime = (t) => new Date(t).toLocaleString('vi-VN');

// --- LOGIC MỚI (XÓA) ---
const handleDelete = async (id) => {
  if (confirm('Bạn có chắc muốn xóa khách hàng này?')) {
    try {
      await axios.delete(
        `http://http://103.82.195.119:5000/api/guest/leads/${id}`,
      );
      fetchLeads();
    } catch (e) {
      alert('Lỗi xóa khách hàng');
    }
  }
};

const logout = () => {
  localStorage.removeItem('user_info');
  router.push('/login');
};

onMounted(() => {
  if (!user.value.id) router.push('/login');
  fetchLeads();
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
        <router-link to="/leads" class="nav-item active"
          >📞 Khách hàng</router-link
        >
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
        <div class="header-left">
          <h1>Khách Hàng Tiềm Năng</h1>
          <p>Danh sách đăng ký tư vấn từ Landing Page</p>
        </div>

        <div class="header-right">
          <div class="stats-badges">
            <span class="badge red">Mới: {{ stats.new }}</span>
            <span class="badge blue">Đang tư vấn: {{ stats.contacted }}</span>
          </div>

          <NotificationToast role="user" :userId="user.id" />
        </div>
      </header>

      <div class="content-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Ngày đăng ký</th>
              <th>Họ tên</th>
              <th>SĐT / Email</th>
              <th>Nhu cầu</th>
              <th>Trạng thái</th>
              <th style="text-align: right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="lead in leads" :key="lead.id">
              <td>{{ formatTime(lead.created_at) }}</td>
              <td style="font-weight: bold">{{ lead.full_name }}</td>
              <td>
                <div style="font-weight: 500; color: var(--primary)">
                  {{ lead.phone }}
                </div>
                <small style="color: #64748b">{{ lead.email }}</small>
              </td>
              <td style="max-width: 250px; color: #475569; font-size: 13px">
                {{ lead.message }}
              </td>
              <td>
                <span v-if="lead.status === 'new'" class="status-badge new"
                  >Mới tinh</span
                >
                <span
                  v-if="lead.status === 'contacted'"
                  class="status-badge contacted"
                  >Đang chăm sóc</span
                >
                <span v-if="lead.status === 'done'" class="status-badge done"
                  >Đã chốt/Xong</span
                >
              </td>
              <td style="text-align: right">
                <div class="action-group">
                  <button
                    v-if="lead.status === 'new'"
                    @click="updateStatus(lead, 'contacted')"
                    class="btn-action call"
                    title="Đã gọi điện"
                  >
                    📞 Gọi
                  </button>
                  <button
                    v-if="lead.status !== 'done'"
                    @click="updateStatus(lead, 'done')"
                    class="btn-action done"
                    title="Hoàn tất"
                  >
                    ✅ Xong
                  </button>
                  <button
                    @click="handleDelete(lead.id)"
                    class="btn-icon delete"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="leads.length === 0">
              <td colspan="6" class="empty-text">Chưa có khách đăng ký nào</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* --- LAYOUT CHUNG & SIDEBAR (LUXURY STYLE) --- */
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

/* --- MAIN CONTENT --- */
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
.header-left h1 {
  font-size: 28px;
  margin: 0;
  font-family: var(--font-heading);
  color: var(--dark);
}
.header-left p {
  color: var(--gray);
  margin: 5px 0 0 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stats-badges {
  display: flex;
  gap: 10px;
}
.badge {
  padding: 6px 15px;
  border-radius: 20px;
  color: white;
  font-weight: bold;
  font-size: 13px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
.badge.red {
  background: #ef4444;
}
.badge.blue {
  background: #3b82f6;
}

/* TABLE & CARD */
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
.empty-text {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-style: italic;
}

/* STATUS BADGES */
.status-badge {
  padding: 6px 12px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}
.status-badge.new {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}
.status-badge.contacted {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #bfdbfe;
}
.status-badge.done {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

/* ACTIONS */
.action-group {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
}
.btn-action {
  border: none;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: white;
  transition: 0.2s;
}
.btn-action.call {
  background: #3b82f6;
}
.btn-action.call:hover {
  background: #2563eb;
}
.btn-action.done {
  background: #10b981;
}
.btn-action.done:hover {
  background: #059669;
}

.btn-icon.delete {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fef2f2;
  color: #ef4444;
  transition: 0.2s;
  margin-left: 5px;
}
.btn-icon.delete:hover {
  transform: scale(1.1);
  background: #fee2e2;
}
</style>
