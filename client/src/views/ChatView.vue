<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
// Import Component Thông báo
import NotificationToast from '../components/NotificationToast.vue';

const router = useRouter();
const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));

// --- LOGIC CHAT (GIỮ NGUYÊN) ---
const messages = ref([]);
const newMessage = ref('');
const chatContainer = ref(null);
let intervalId = null;

const fetchChat = async () => {
  try {
    const res = await axios.get('http://103.82.195.119:5000/api/internal-chat');
    // Chỉ cuộn xuống nếu có tin nhắn mới
    if (res.data.length !== messages.value.length) {
      messages.value = res.data;
      scrollToBottom();
    } else {
      messages.value = res.data;
    }
  } catch (e) {}
};

const sendMessage = async () => {
  if (!newMessage.value.trim()) return;
  try {
    await axios.post('http://103.82.195.119:5000/api/internal-chat', {
      sender_id: user.value.id,
      content: newMessage.value,
    });
    newMessage.value = '';
    fetchChat();
  } catch (e) {
    alert('Lỗi gửi tin');
  }
};

const deleteMessage = async (msg) => {
  if (!confirm('Bạn muốn thu hồi tin nhắn này?')) return;
  try {
    await axios.delete(
      `http://103.82.195.119:5000/api/internal-chat/${msg.id}`,
    );
    messages.value = messages.value.filter((m) => m.id !== msg.id);
  } catch (e) {
    alert('Lỗi xóa tin');
  }
};

const scrollToBottom = async () => {
  await nextTick();
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
};

const formatTime = (t) =>
  new Date(t).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  });

const logout = () => {
  localStorage.removeItem('user_info');
  router.push('/login');
};

onMounted(() => {
  if (!user.value.id) router.push('/login');
  fetchChat();
  intervalId = setInterval(fetchChat, 2000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
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
        <router-link to="/chat" class="nav-item active"
          >💬 Chat Nội bộ</router-link
        >
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
          <h1>Chat Nội bộ Ban Quản Lý</h1>
          <div class="online-status">
            <span class="dot"></span> Đang trực tuyến
          </div>
        </div>
        <div class="header-right">
          <NotificationToast role="user" :userId="user.id" />
        </div>
      </header>

      <div class="chat-container">
        <div class="chat-box" ref="chatContainer">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="[
              'msg-row',
              msg.sender_id === user.id ? 'my-msg' : 'other-msg',
            ]"
          >
            <div v-if="msg.sender_id !== user.id" class="msg-avatar">
              {{ msg.full_name.charAt(0) }}
            </div>

            <div class="msg-wrapper">
              <div class="sender-name" v-if="msg.sender_id !== user.id">
                {{ msg.full_name }}
                <span v-if="msg.role === 'admin'" class="admin-star">★</span>
              </div>

              <div class="bubble-group">
                <div class="msg-bubble">
                  <div class="text">{{ msg.content }}</div>
                </div>

                <button
                  v-if="msg.sender_id === user.id || user.role === 'admin'"
                  class="btn-delete-msg"
                  @click="deleteMessage(msg)"
                  title="Xóa tin nhắn"
                >
                  🗑️
                </button>
              </div>

              <div class="time">{{ formatTime(msg.created_at) }}</div>
            </div>
          </div>
        </div>

        <div class="chat-input-area">
          <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            placeholder="Nhập nội dung thảo luận..."
            class="input-msg"
          />
          <button @click="sendMessage" class="btn-send">Gửi ➤</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* --- 1. LAYOUT CHUNG & SIDEBAR (COPY CHUẨN TỪ APARTMENT VIEW) --- */
.app-layout {
  display: flex;
  height: 100vh;
  background: var(--light);
  color: var(--dark);
  font-family: 'Inter', sans-serif;
  overflow: hidden;
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

/* --- 2. MAIN CONTENT (ĐIỀU CHỈNH PADDING ĐỂ KHỚP) --- */
.main-content {
  flex: 1;
  padding: 30px 40px; /* Padding chuẩn giống các trang khác */
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-shrink: 0;
}
.header h1 {
  font-size: 28px;
  margin: 0;
  font-family: var(--font-heading);
  color: var(--dark);
}
.online-status {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #16a34a;
  font-size: 12px;
  font-weight: 600;
  background: #dcfce7;
  padding: 4px 10px;
  border-radius: 20px;
  width: fit-content;
  margin-top: 5px;
}
.dot {
  width: 6px;
  height: 6px;
  background: #16a34a;
  border-radius: 50%;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

/* --- 3. CHAT INTERFACE --- */
.chat-container {
  flex: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03); /* Shadow nhẹ hơn cho khớp */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #f1f5f9; /* Viền khớp màu */
  /* Chiều cao tự động lấp đầy phần còn lại */
}

.chat-box {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.chat-box::-webkit-scrollbar {
  width: 6px;
}
.chat-box::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.msg-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  max-width: 80%;
}
.my-msg {
  align-self: flex-end;
  flex-direction: row-reverse;
}
.other-msg {
  align-self: flex-start;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background: #e2e8f0;
  color: #64748b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
}

.msg-wrapper {
  display: flex;
  flex-direction: column;
}
.my-msg .msg-wrapper {
  align-items: flex-end;
}

.bubble-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.my-msg .bubble-group {
  flex-direction: row-reverse;
}

.msg-bubble {
  padding: 10px 16px;
  border-radius: 16px;
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  min-width: 40px;
  word-break: break-word;
}

.my-msg .msg-bubble {
  background: linear-gradient(135deg, var(--primary) 0%, #b5952f 100%);
  color: white;
  border-bottom-right-radius: 2px;
}
.other-msg .msg-bubble {
  background: white;
  color: var(--dark);
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 2px;
}

.sender-name {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 3px;
  margin-left: 2px;
}
.admin-star {
  color: #d4af37;
}
.text {
  font-size: 14px;
  line-height: 1.4;
}
.time {
  font-size: 10px;
  margin-top: 3px;
  color: #94a3b8;
}

.btn-delete-msg {
  background: #fee2e2;
  border: none;
  color: #ef4444;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  cursor: pointer;
  opacity: 0;
  transition: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.msg-row:hover .btn-delete-msg {
  opacity: 1;
}
.btn-delete-msg:hover {
  background: #ef4444;
  color: white;
  transform: scale(1.1);
}

/* Input Area */
.chat-input-area {
  padding: 20px;
  background: white;
  border-top: 1px solid #f1f5f9;
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}
.input-msg {
  flex: 1;
  padding: 12px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 25px;
  outline: none;
  background: #f8fafc;
  transition: 0.2s;
  font-family: var(--font-body);
  font-size: 14px;
}
.input-msg:focus {
  background: white;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}

.btn-send {
  background: var(--dark);
  color: var(--primary);
  border: none;
  padding: 0 25px;
  border-radius: 25px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  font-size: 14px;
}
.btn-send:hover {
  background: #1e293b;
  transform: translateX(2px);
}
</style>
