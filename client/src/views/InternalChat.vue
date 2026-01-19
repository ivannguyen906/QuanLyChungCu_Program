<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const messages = ref([]);
const newMessage = ref('');
const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));
const chatBox = ref(null);
let interval;

// Lấy tin nhắn
const fetchMessages = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/internal-chat');
    // Chỉ cuộn xuống nếu đang ở dưới cùng hoặc mới vào (logic đơn giản là cứ load xong thì cuộn nếu cần)
    const shouldScroll = messages.value.length !== res.data.length;
    messages.value = res.data;
    if (shouldScroll) scrollToBottom();
  } catch (e) {}
};

// Gửi tin nhắn
const sendMessage = async () => {
  if (!newMessage.value.trim()) return;
  try {
    await axios.post('http://localhost:3000/api/internal-chat', {
      sender_id: user.value.id,
      content: newMessage.value,
    });
    newMessage.value = '';
    fetchMessages();
  } catch (e) {
    alert('Lỗi gửi tin');
  }
};

// Cuộn xuống cuối
const scrollToBottom = () => {
  nextTick(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
  });
};

// Đăng xuất
const logout = () => {
  localStorage.removeItem('user_info');
  router.push('/');
};

onMounted(() => {
  if (!user.value.username) router.push('/');
  fetchMessages();
  interval = setInterval(fetchMessages, 3000); // Polling 3s
});

onUnmounted(() => clearInterval(interval));
</script>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo-icon">🏢</div>
        <div class="brand-text">
          <h3>Quản lý chung cư</h3>
          <small>Hệ thống toàn diện</small>
        </div>
      </div>
      <nav class="nav-menu">
        <router-link to="/dashboard" class="nav-item">🏠 Tổng quan</router-link>
        <router-link to="/apartments" class="nav-item">🏢 Căn hộ</router-link>
        <router-link to="/staff" class="nav-item">🛡️ Nhân sự</router-link>
        <router-link to="/residents" class="nav-item">👥 Cư dân</router-link>
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
          <strong>{{ user.full_name }}</strong
          ><small>{{ user.role }}</small>
        </div>
        <button @click="logout" class="btn-logout-icon" title="Đăng xuất">
          🚪
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="header"><h1>Thảo luận nội bộ</h1></header>

      <div class="chat-container">
        <div class="chat-messages" ref="chatBox">
          <div
            v-for="msg in messages"
            :key="msg.id"
            :class="['message', msg.sender_id === user.id ? 'mine' : 'theirs']"
          >
            <div class="msg-sender" v-if="msg.sender_id !== user.id">
              {{ msg.full_name }}
            </div>
            <div class="msg-bubble">{{ msg.content }}</div>
            <div class="msg-time">
              {{ new Date(msg.created_at).toLocaleTimeString().slice(0, 5) }}
            </div>
          </div>
        </div>
        <div class="chat-input">
          <input
            v-model="newMessage"
            @keyup.enter="sendMessage"
            placeholder="Nhập tin nhắn..."
          />
          <button @click="sendMessage">Gửi ➤</button>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Layout */
.app-layout {
  display: flex;
  height: 100vh;
  background: #f8fafc;
  font-family: 'Inter', sans-serif;
}
.sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e2e8f0;
  padding: 24px;
  display: flex;
  flex-direction: column;
}
.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 40px;
  padding-left: 8px;
}
.logo-icon {
  font-size: 24px;
  background: #f1f5f9;
  padding: 8px;
  border-radius: 12px;
}
.brand-text h3 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}
.nav-menu {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #64748b;
  text-decoration: none;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.2s;
}
.nav-item:hover {
  background: #f8fafc;
  color: #1e293b;
  transform: translateX(4px);
}
.nav-item.active,
.nav-item.router-link-active {
  background: #eff6ff;
  color: #2563eb;
  font-weight: 600;
}

/* Profile & Logout */
.user-profile {
  border-top: 1px solid #f1f5f9;
  padding-top: 20px;
  margin-top: auto;
  display: flex;
  gap: 12px;
  align-items: center;
}
.avatar {
  width: 40px;
  height: 40px;
  background: #2563eb;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.btn-logout-icon {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 20px;
  color: #94a3b8;
  transition: color 0.2s;
}
.btn-logout-icon:hover {
  color: #ef4444;
}

/* Main Chat Area */
.main-content {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
}
.header {
  margin-bottom: 20px;
}

.chat-container {
  flex: 1;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 0;
} /* height: 0 force flex to work properly */
.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-input {
  padding: 15px;
  background: white;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 10px;
}
.chat-input input {
  flex: 1;
  padding: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 25px;
  outline: none;
}
.chat-input button {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0 20px;
  border-radius: 25px;
  cursor: pointer;
  font-weight: bold;
}

/* Messages Bubbles */
.message {
  max-width: 60%;
  display: flex;
  flex-direction: column;
}
.message.mine {
  align-self: flex-end;
  align-items: flex-end;
}
.message.theirs {
  align-self: flex-start;
  align-items: flex-start;
}

.msg-sender {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 2px;
  margin-left: 5px;
}
.msg-bubble {
  padding: 10px 15px;
  border-radius: 15px;
  font-size: 14px;
  line-height: 1.4;
  position: relative;
  word-wrap: break-word;
}
.mine .msg-bubble {
  background: #2563eb;
  color: white;
  border-bottom-right-radius: 2px;
}
.theirs .msg-bubble {
  background: white;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 2px;
}
.msg-time {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
  margin: 2px 5px 0;
}
</style>
