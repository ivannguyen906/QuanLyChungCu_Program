<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
// Import Component Thông báo
import NotificationToast from '../components/NotificationToast.vue';

const router = useRouter();
const announcements = ref([]);
const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));
const form = ref({ title: '', content: '' });

// --- LOGIC FETCH DATA (GIỮ NGUYÊN) ---
const fetchAnnouncements = async () => {
  try {
    const res = await axios.get(
      'http://http://103.82.195.119:5000/api/announcements',
    );
    announcements.value = res.data;
  } catch (e) {}
};

// Gửi thông báo (Chỉ Admin/QL)
const handleSend = async () => {
  if (!form.value.title || !form.value.content)
    return alert('Vui lòng nhập đủ thông tin!');
  if (!confirm('Tin này sẽ được gửi đến TẤT CẢ cư dân. Xác nhận gửi?')) return;

  try {
    await axios.post(
      'http://http://103.82.195.119:5000/api/announcements',
      form.value,
    );
    alert('Đã gửi thành công!');
    form.value = { title: '', content: '' };
    fetchAnnouncements();
  } catch (e) {
    alert('Lỗi gửi tin');
  }
};

// Xóa (Chỉ Admin)
const handleDelete = async (id) => {
  if (confirm('Xóa tin này khỏi lịch sử?')) {
    await axios.delete(
      `http://http://103.82.195.119:5000/api/announcements/${id}`,
    );
    fetchAnnouncements();
  }
};

const logout = () => {
  localStorage.removeItem('user_info');
  router.push('/login');
};

onMounted(() => {
  if (!user.value.username) router.push('/login');
  fetchAnnouncements();
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
        <router-link to="/requests" class="nav-item">🔔 Yêu cầu</router-link>
        <router-link to="/chat" class="nav-item">💬 Chat Nội bộ</router-link>
        <router-link to="/announcements" class="nav-item active"
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
          <h1>Bảng tin cư dân</h1>
          <p>Thông báo sự kiện, bảo trì đến toàn bộ tòa nhà</p>
        </div>

        <div class="header-actions">
          <NotificationToast role="user" :userId="user.id" />
        </div>
      </header>

      <div v-if="user.role !== 'resident'" class="compose-card">
        <div class="card-header">
          <h3>📢 Soạn thông báo mới</h3>
        </div>
        <div class="card-body">
          <div class="form-group">
            <input
              v-model="form.title"
              placeholder="Tiêu đề (VD: Lịch cắt nước ngày 20/10...)"
              class="input-title"
            />
          </div>
          <div class="form-group">
            <textarea
              v-model="form.content"
              rows="3"
              placeholder="Nội dung chi tiết..."
              class="input-content"
            ></textarea>
          </div>
          <div class="form-actions">
            <button @click="handleSend" class="btn-send">
              🚀 Phát loa toàn chung cư
            </button>
          </div>
        </div>
      </div>

      <div class="news-feed">
        <div v-for="news in announcements" :key="news.id" class="news-item">
          <div class="news-icon">🔔</div>
          <div class="news-content">
            <div class="news-header">
              <h4>{{ news.title }}</h4>
              <small>{{
                new Date(news.created_at).toLocaleString('vi-VN')
              }}</small>
            </div>
            <p>{{ news.content }}</p>
          </div>

          <button
            v-if="user.role === 'admin'"
            @click="handleDelete(news.id)"
            class="btn-del"
            title="Xóa thông báo"
          >
            ×
          </button>
        </div>
      </div>
    </main>
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

/* --- COMPOSE CARD --- */
.compose-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
  margin-bottom: 30px;
  border: 1px solid #f1f5f9;
  overflow: hidden;
}
.card-header {
  padding: 15px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.card-header h3 {
  margin: 0;
  color: var(--primary);
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.input-title {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-weight: 600;
  box-sizing: border-box;
  font-family: var(--font-body);
}
.input-content {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-sizing: border-box;
  font-family: var(--font-body);
  resize: vertical;
}
.input-title:focus,
.input-content:focus {
  border-color: var(--primary);
  outline: none;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}
.btn-send {
  background: linear-gradient(180deg, var(--primary) 0%, #b5952f 100%);
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}
.btn-send:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* --- NEWS FEED --- */
.news-feed {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.news-item {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  display: flex;
  gap: 15px;
  align-items: flex-start;
  position: relative;
  border: 1px solid #f1f5f9;
  transition: 0.2s;
}
.news-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}

.news-icon {
  font-size: 20px;
  background: #fff7ed;
  color: #ea580c;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
}

.news-content {
  flex: 1;
}
.news-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}
.news-header h4 {
  margin: 0;
  color: var(--dark);
  font-size: 16px;
  font-weight: 600;
}
.news-header small {
  color: #94a3b8;
  font-size: 12px;
}
.news-item p {
  margin: 0;
  color: #475569;
  line-height: 1.5;
  font-size: 14px;
}

.btn-del {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 20px;
  cursor: pointer;
  position: absolute;
  top: 15px;
  right: 15px;
  opacity: 0.3;
  transition: 0.2s;
}
.btn-del:hover {
  opacity: 1;
  transform: scale(1.2);
}
</style>
