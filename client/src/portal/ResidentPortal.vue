<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import axios from 'axios'; // Nhớ import axios
import NotificationToast from '../components/NotificationToast.vue';

const router = useRouter();
const route = useRoute();
const user = ref(JSON.parse(localStorage.getItem('user_info') || 'null'));

// State cho Modal Đổi mật khẩu
const showPassModal = ref(false);
const passForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const logout = () => {
  localStorage.removeItem('user_info');
  router.push('/login');
};

const isActive = (path) => {
  if (path === '/portal' && route.path === '/portal') return true;
  if (path !== '/portal' && route.path.startsWith(path)) return true;
  return false;
};

// XỬ LÝ ĐỔI MẬT KHẨU
const handleChangePassword = async () => {
  // Validate cơ bản
  if (
    !passForm.value.oldPassword ||
    !passForm.value.newPassword ||
    !passForm.value.confirmPassword
  ) {
    return alert('Vui lòng nhập đầy đủ thông tin!');
  }
  if (passForm.value.newPassword !== passForm.value.confirmPassword) {
    return alert('Mật khẩu mới không khớp!');
  }
  if (passForm.value.newPassword.length < 6) {
    return alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
  }

  try {
    await axios.post('http://http://103.82.195.119:5000/api/change-password', {
      id: user.value.id,
      oldPassword: passForm.value.oldPassword,
      newPassword: passForm.value.newPassword,
    });

    alert('🎉 Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');
    logout(); // Đăng xuất để user đăng nhập lại bằng pass mới
  } catch (e) {
    alert(e.response?.data?.message || 'Lỗi đổi mật khẩu!');
  }
};

const pageTitle = computed(() => {
  if (route.path.includes('/bills')) return 'Hóa đơn điện tử';
  if (route.path.includes('/services')) return 'Dịch vụ tiện ích';
  if (route.path.includes('/requests')) return 'Hỗ trợ cư dân';
  if (route.path.includes('/info')) return 'Hồ sơ gia đình';
  if (route.path.includes('/announcements')) return 'Thông báo chung';
  return 'Tổng quan căn hộ';
});

onMounted(() => {
  if (!user.value || !user.value.username) router.push('/login');
});
</script>

<template>
  <div class="app-layout" v-if="user">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo-icon">⚜️</div>
        <div class="brand-text">
          <h3>GRAND MARINA</h3>
          <small>Căn hộ {{ user.apartment_code || '...' }}</small>
        </div>
      </div>

      <nav class="nav-menu">
        <router-link
          to="/portal"
          class="nav-item"
          :class="{ active: isActive('/portal') }"
        >
          <span class="nav-icon">🏠</span> <span>Trang chủ</span>
        </router-link>
        <router-link
          to="/portal/info"
          class="nav-item"
          :class="{ active: isActive('/portal/info') }"
        >
          <span class="nav-icon">👨‍👩‍👧</span> <span>Thông tin & Gia đình</span>
        </router-link>
        <router-link
          to="/portal/bills"
          class="nav-item"
          :class="{ active: isActive('/portal/bills') }"
        >
          <span class="nav-icon">📄</span> <span>Hóa đơn & QR</span>
        </router-link>
        <router-link
          to="/portal/services"
          class="nav-item"
          :class="{ active: isActive('/portal/services') }"
        >
          <span class="nav-icon">💲</span> <span>Bảng giá dịch vụ</span>
        </router-link>
        <router-link
          to="/portal/requests"
          class="nav-item"
          :class="{ active: isActive('/portal/requests') }"
        >
          <span class="nav-icon">💬</span> <span>Yêu cầu & Hỏi đáp</span>
        </router-link>
        <router-link
          to="/portal/announcements"
          class="nav-item"
          :class="{ active: isActive('/portal/announcements') }"
        >
          <span class="nav-icon">📢</span> <span>Thông báo chung</span>
        </router-link>
      </nav>

      <div class="user-profile">
        <div class="avatar">{{ user.full_name?.charAt(0).toUpperCase() }}</div>
        <div class="info">
          <strong>{{ user.full_name }}</strong>
          <small>Cư dân</small>
        </div>
        <div class="action-btns">
          <button
            @click="showPassModal = true"
            class="btn-icon"
            title="Đổi mật khẩu"
          >
            🔑
          </button>
          <button @click="logout" class="btn-icon" title="Đăng xuất">↪</button>
        </div>
      </div>
    </aside>

    <main class="main-content">
      <header class="header">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>Xin chào, chúc bạn một ngày tốt lành!</p>
        </div>
        <div class="header-actions">
          <NotificationToast role="resident" :userId="user.id" />
        </div>
      </header>

      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <div
      v-if="showPassModal"
      class="modal-overlay"
      @click.self="showPassModal = false"
    >
      <div class="modal-box">
        <div class="modal-header">
          <h3>🔒 Đổi Mật Khẩu</h3>
          <button @click="showPassModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Mật khẩu hiện tại</label>
            <input
              type="password"
              v-model="passForm.oldPassword"
              placeholder="Nhập mật khẩu cũ..."
              class="input-field"
            />
          </div>
          <div class="form-group">
            <label>Mật khẩu mới</label>
            <input
              type="password"
              v-model="passForm.newPassword"
              placeholder="Nhập mật khẩu mới (min 6 ký tự)"
              class="input-field"
            />
          </div>
          <div class="form-group">
            <label>Xác nhận mật khẩu mới</label>
            <input
              type="password"
              v-model="passForm.confirmPassword"
              placeholder="Nhập lại mật khẩu mới"
              class="input-field"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showPassModal = false" class="btn-outline">
            Hủy
          </button>
          <button @click="handleChangePassword" class="btn-primary">
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* CSS CŨ GIỮ NGUYÊN, CHỈ THÊM/SỬA PHẦN DƯỚI ĐÂY */

/* LAYOUT & SIDEBAR (Giữ nguyên như cũ) */
.app-layout {
  display: flex;
  height: 100vh;
  background: var(--light);
  color: var(--dark);
  font-family: 'Inter', sans-serif;
}
.sidebar {
  width: 270px;
  background: #0f172a;
  color: white;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  box-shadow: 4px 0 15px rgba(0, 0, 0, 0.1);
  z-index: 10;
}
.brand {
  padding: 35px 25px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.logo-icon {
  font-size: 28px;
  color: #d4af37;
  background: transparent;
  padding: 0;
}
.brand-text h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  font-family: 'Playfair Display', serif;
  letter-spacing: 1px;
}
.brand-text small {
  color: #94a3b8;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 2px;
  display: block;
}
.nav-menu {
  flex: 1;
  padding: 25px 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 18px;
  color: #94a3b8;
  text-decoration: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}
.nav-icon {
  width: 24px;
  text-align: center;
  margin-right: 12px;
  font-size: 18px;
}
.nav-item:hover:not(.active) {
  background: rgba(255, 255, 255, 0.05);
  color: #e2e8f0;
  transform: translateX(4px);
}
.nav-item.active {
  background: linear-gradient(90deg, #d4af37 0%, #b5952f 100%);
  color: #0f172a;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(212, 175, 55, 0.3);
}

/* USER PROFILE - SỬA ĐỂ CÓ NÚT KEY */
.user-profile {
  padding: 20px 25px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
  margin-top: auto;
}
.avatar {
  width: 38px;
  height: 38px;
  border: 1px solid #d4af37;
  color: #d4af37;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
}
.info {
  flex: 1;
}
.info strong {
  display: block;
  font-size: 14px;
  color: white;
  margin-bottom: 2px;
}
.info small {
  font-size: 11px;
  color: #94a3b8;
}

.action-btns {
  display: flex;
  gap: 5px;
}
.btn-icon {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 18px;
  padding: 5px;
  transition: 0.2s;
  border-radius: 4px;
}
.btn-icon:hover {
  color: #d4af37;
  background: rgba(255, 255, 255, 0.1);
}

/* MAIN CONTENT */
.main-content {
  flex: 1;
  padding: 40px;
  overflow-y: auto;
  background: #f8fafc;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}
.header h1 {
  font-size: 26px;
  margin: 0;
  font-family: 'Playfair Display', serif;
  color: #1e293b;
}
.header p {
  color: #64748b;
  margin: 5px 0 0;
  font-size: 14px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* MODAL STYLES (MỚI THÊM) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-box {
  background: white;
  width: 400px;
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
  padding: 15px 25px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #0f172a;
}
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
}

.modal-body {
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
.input-field {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-sizing: border-box;
  font-family: 'Inter', sans-serif;
}
.input-field:focus {
  outline: none;
  border-color: #d4af37;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.modal-footer {
  padding: 15px 25px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #f8fafc;
  border-radius: 0 0 12px 12px;
}
.btn-primary {
  background: #0f172a;
  color: #d4af37;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
}
.btn-primary:hover {
  background: #1e293b;
}
.btn-outline {
  background: white;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 8px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
}
.btn-outline:hover {
  background: #f1f5f9;
}
</style>
