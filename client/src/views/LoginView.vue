<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const isLoading = ref(false);

// --- CÁC BIẾN CHO QUÊN MẬT KHẨU ---
const showForgotModal = ref(false);
const forgotForm = ref({ username: '', email: '' });
const forgotLoading = ref(false);

// Xử lý Đăng nhập
const handleLogin = async () => {
  if (!username.value || !password.value)
    return alert('Vui lòng nhập đầy đủ thông tin');

  isLoading.value = true;
  try {
    const res = await axios.post(
      'http://http://103.82.195.119:5000/api/login',
      {
        username: username.value,
        password: password.value,
      },
    );

    localStorage.setItem('user_info', JSON.stringify(res.data));

    if (res.data.role === 'resident') {
      router.push('/portal');
    } else {
      router.push('/dashboard');
    }
  } catch (e) {
    console.error(e);
    alert(
      e.response?.data?.message || 'Đăng nhập thất bại! Kiểm tra lại Server.',
    );
  } finally {
    isLoading.value = false;
  }
};

// Xử lý Quên mật khẩu
const handleForgotPassword = async () => {
  if (!forgotForm.value.username || !forgotForm.value.email)
    return alert('Vui lòng nhập đủ Tài khoản và Email');

  forgotLoading.value = true;
  try {
    const res = await axios.post(
      'http://http://103.82.195.119:5000/api/forgot-password',
      forgotForm.value,
    );
    alert(res.data.message);
    if (res.data.success) {
      showForgotModal.value = false; // Đóng modal nếu thành công
      // Reset form
      forgotForm.value = { username: '', email: '' };
    }
  } catch (e) {
    alert('Lỗi: ' + (e.response?.data?.message || e.message));
  } finally {
    forgotLoading.value = false;
  }
};

const goHome = () => {
  router.push('/');
};
</script>

<template>
  <div class="login-container">
    <div class="login-content">
      <div class="login-card">
        <div class="brand-header">
          <div class="logo-icon">⚜️</div>
          <h2>GRAND MARINA</h2>
          <p>HỆ THỐNG QUẢN LÝ VẬN HÀNH CAO CẤP</p>
        </div>

        <div class="login-form">
          <div class="form-group">
            <label>TÀI KHOẢN</label>
            <div class="input-group">
              <span class="icon">👤</span>
              <input
                v-model="username"
                type="text"
                placeholder="Nhập mã nhân viên / mã cư dân"
                @keyup.enter="handleLogin"
              />
            </div>
          </div>

          <div class="form-group">
            <label>MẬT KHẨU</label>
            <div class="input-group">
              <span class="icon">🔒</span>
              <input
                v-model="password"
                type="password"
                placeholder="••••••"
                @keyup.enter="handleLogin"
              />
            </div>
          </div>

          <div class="forgot-link">
            <span @click="showForgotModal = true">Quên mật khẩu?</span>
          </div>

          <button @click="handleLogin" :disabled="isLoading" class="btn-login">
            {{ isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP HỆ THỐNG' }}
          </button>
        </div>

        <div class="login-footer">
          <a href="#" @click.prevent="goHome">← Quay lại trang chủ</a>
          <span>Hotline: 0123.456.789</span>
        </div>
      </div>
    </div>

    <div v-if="showForgotModal" class="modal-overlay">
      <div class="modal-card">
        <div class="brand-header">
          <h2 style="font-size: 20px">KHÔI PHỤC MẬT KHẨU</h2>
          <p>NHẬP THÔNG TIN ĐỂ NHẬN MẬT KHẨU MỚI</p>
        </div>

        <div class="login-form">
          <div class="form-group">
            <label>TÀI KHOẢN CỦA BẠN</label>
            <div class="input-group">
              <span class="icon">👤</span>
              <input
                v-model="forgotForm.username"
                placeholder="Ví dụ: AD1, DC1..."
              />
            </div>
          </div>
          <div class="form-group">
            <label>EMAIL ĐÃ ĐĂNG KÝ</label>
            <div class="input-group">
              <span class="icon">📧</span>
              <input
                v-model="forgotForm.email"
                type="email"
                placeholder="Ví dụ: abc@gmail.com"
              />
            </div>
          </div>

          <div class="modal-actions">
            <button @click="showForgotModal = false" class="btn-cancel">
              HỦY BỎ
            </button>
            <button
              @click="handleForgotPassword"
              class="btn-login"
              style="margin-top: 0; width: auto; flex: 1"
              :disabled="forgotLoading"
            >
              {{ forgotLoading ? 'ĐANG GỬI...' : 'XÁC NHẬN' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* BACKGROUND & CONTAINER */
.login-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')
    no-repeat center center;
  background-size: cover;
  position: relative;
}

/* Lớp phủ tối màu */
.login-container::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(10, 25, 47, 0.75); /* Xanh đen đậm */
}

.login-content {
  position: relative;
  z-index: 1;
}

/* CARD LOGIN */
.login-card {
  background: white;
  width: 420px;
  padding: 40px 50px;
  border-radius: 4px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  border-top: 5px solid #d4af37; /* Viền vàng Luxury */
  text-align: center;
}

/* BRANDING */
.logo-icon {
  font-size: 48px;
  color: #d4af37;
  margin-bottom: 10px;
}
.brand-header h2 {
  margin: 0;
  color: #0f172a;
  font-family: 'Playfair Display', serif;
  letter-spacing: 1px;
  font-size: 24px;
}
.brand-header p {
  margin: 5px 0 30px;
  color: #64748b;
  font-size: 11px;
  letter-spacing: 2px;
  font-weight: 600;
  text-transform: uppercase;
}

/* FORM */
.form-group {
  margin-bottom: 20px;
  text-align: left;
}
.form-group label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  margin-bottom: 8px;
  text-transform: uppercase;
}
.input-group {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: #f8fafc;
  padding: 10px 12px;
  transition: 0.3s;
}
.input-group:focus-within {
  border-color: #d4af37;
  background: white;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}
.icon {
  font-size: 16px;
  color: #94a3b8;
  margin-right: 10px;
}
.input-group input {
  border: none;
  background: transparent;
  width: 100%;
  outline: none;
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

/* BUTTON */
.btn-login {
  width: 100%;
  background: #0f172a; /* Màu xanh đen */
  color: #d4af37; /* Chữ vàng */
  padding: 14px;
  border: none;
  border-radius: 4px;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: 0.3s;
  letter-spacing: 1px;
  margin-top: 10px;
}
.btn-login:hover {
  background: #1e293b;
  transform: translateY(-1px);
}
.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* LINK QUÊN MẬT KHẨU */
.forgot-link {
  text-align: right;
  margin-top: -10px;
  margin-bottom: 20px;
}
.forgot-link span {
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}
.forgot-link span:hover {
  color: #d4af37;
  text-decoration: underline;
}

/* FOOTER */
.login-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}
.login-footer a {
  color: #64748b;
  text-decoration: none;
  transition: 0.2s;
  cursor: pointer; /* Thêm con trỏ tay */
}
.login-footer a:hover {
  color: #d4af37;
}

/* MODAL STYLES (Đồng bộ Luxury) */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 25, 47, 0.85); /* Nền tối đồng bộ */
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Tái sử dụng class .modal-card giống login-card nhưng override một chút */
.modal-card {
  background: white;
  width: 400px;
  padding: 30px 40px;
  border-radius: 4px;
  border-top: 5px solid #d4af37;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}
.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}
.btn-cancel {
  padding: 14px;
  border: 1px solid #e2e8f0;
  background: white;
  color: #64748b;
  font-weight: 700;
  font-size: 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: 0.3s;
}
.btn-cancel:hover {
  background: #f1f5f9;
  color: #0f172a;
}
</style>
