<template>
  <div class="luxury-chat-app">
    <header class="app-header">
      <div class="header-container">
        <div class="logo-box">G</div>
        <div class="brand-text">
          <h2>GRAND MARINA</h2>
          <span class="status-indicator">
            <span class="dot"></span> AI Concierge Active
          </span>
        </div>
      </div>
    </header>

    <main class="chat-window" ref="chatBox">
      <div
        v-for="(msg, index) in chatHistory"
        :key="index"
        :class="['message-row', msg.role]"
      >
        <div class="bubble-container">
          <div class="bubble" v-html="formatContent(msg.content)"></div>
          <div class="message-time">{{ msg.time }}</div>
        </div>
      </div>

      <div v-if="isLoading" class="message-row assistant">
        <div class="bubble loading-bubble">
          <div class="dot-pulse"></div>
        </div>
      </div>
    </main>

    <footer class="input-bar">
      <div class="input-pill">
        <input
          v-model="userInput"
          @keyup.enter="handleSend"
          placeholder="Nhập yêu cầu (VD: Phí căn CH104)..."
          :disabled="isLoading"
        />
        <button
          @click="handleSend"
          :disabled="isLoading || !userInput.trim()"
          class="send-button"
        >
          <i class="pi pi-arrow-up"></i>
        </button>
      </div>
    </footer>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'GuestSmartSearch',
  data() {
    return {
      userInput: '',
      isLoading: false,
      chatHistory: [
        {
          role: 'assistant',
          content:
            'Kính chào Quý khách. Tôi là trợ lý ảo hỗ trợ thông tin căn hộ **Grand Marina**. Quý khách cần hỗ trợ gì ạ?',
          time: this.getCurrentTime(),
        },
      ],
      // ĐẢM BẢO ĐÂY LÀ PRODUCTION URL TRONG N8N
      webhookUrl:
        'https://ducthagcontact9066.app.n8n.cloud/webhook/smart-search',
    };
  },
  methods: {
    getCurrentTime() {
      return new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    },
    // FIX HIỂN THỊ MARKDOWN VÀ XUỐNG DÒNG
    formatContent(text) {
      if (!text) return '';
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
    },
    async handleSend() {
      if (!this.userInput.trim()) return;

      const userText = this.userInput;

      this.chatHistory.push({
        role: 'user',
        content: userText,
        time: this.getCurrentTime(),
      });

      this.userInput = '';
      this.isLoading = true;
      this.scrollToBottom();

      try {
        const response = await axios({
          method: 'post',
          url: this.webhookUrl,
          data: {
            message: userText, // ✅ FIX
          },
          headers: {
            'Content-Type': 'application/json',
          },
        });

        console.log('API RESPONSE:', response.data); // debug

        const reply =
          response.data?.message ||
          response.data?.data?.message ||
          'Đã nhận yêu cầu.';

        this.chatHistory.push({
          role: 'assistant',
          content: reply, // ✅ FIX
          time: this.getCurrentTime(),
        });
      } catch (error) {
        console.error('Axios Error:', error);

        let errorMsg =
          '⚠️ Không thể kết nối server. Quý khách vui lòng thử lại sau.';

        if (error.response) {
          errorMsg = `⚠️ Server lỗi: ${error.response.status}`;
        }

        this.chatHistory.push({
          role: 'assistant',
          content: errorMsg,
          time: this.getCurrentTime(),
        });
      } finally {
        this.isLoading = false;
        this.scrollToBottom();
      }
    },
    scrollToBottom() {
      this.$nextTick(() => {
        const el = this.$refs.chatBox;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },
  },
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600&family=Montserrat:wght@300;400;600&display=swap');

.luxury-chat-app {
  height: 100vh;
  background: #000;
  display: flex;
  flex-direction: column;
  font-family: 'Montserrat', sans-serif;
  color: #fff;
}

/* Header Style */
.app-header {
  padding: 1.5rem;
  background: #0a0a0a;
  border-bottom: 1px solid rgba(212, 175, 55, 0.4);
}

.header-container {
  display: flex;
  align-items: center;
  gap: 15px;
}

.logo-box {
  width: 35px;
  height: 35px;
  background: linear-gradient(135deg, #d4af37, #fcf6ba);
  border-radius: 4px;
  color: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-weight: bold;
}

.brand-text h2 {
  font-family: 'Cinzel', serif;
  font-size: 1rem;
  letter-spacing: 2px;
  margin: 0;
  color: #d4af37;
}

.status-indicator {
  font-size: 0.65rem;
  color: #4ade80;
  display: flex;
  align-items: center;
  gap: 5px;
}

.dot {
  width: 6px;
  height: 6px;
  background: #4ade80;
  border-radius: 50%;
  box-shadow: 0 0 5px #4ade80;
}

/* Chat Area */
.chat-window {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.message-row {
  display: flex;
  width: 100%;
}

.message-row.user {
  justify-content: flex-end;
}
.message-row.assistant {
  justify-content: flex-start;
}

.bubble {
  max-width: 280px;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.user .bubble {
  background: #d4af37;
  color: #000;
  border-bottom-right-radius: 2px;
  font-weight: 500;
}

.assistant .bubble {
  background: #1a1a1a;
  border: 1px solid rgba(212, 175, 55, 0.2);
  color: #f0f0f0;
  border-bottom-left-radius: 2px;
}

.message-time {
  font-size: 0.6rem;
  margin-top: 4px;
  opacity: 0.4;
  text-align: right;
}

/* Input Bar */
.input-bar {
  padding: 1.5rem;
  background: #000;
}

.input-pill {
  max-width: 600px;
  margin: 0 auto;
  background: #111;
  border: 1px solid #d4af37;
  border-radius: 25px;
  display: flex;
  padding: 5px 5px 5px 20px;
}

input {
  flex: 1;
  background: transparent;
  border: none;
  color: #fff;
  outline: none;
  font-size: 0.9rem;
}

.send-button {
  width: 38px;
  height: 38px;
  background: #d4af37;
  border: none;
  border-radius: 50%;
  color: #000;
  cursor: pointer;
}

/* Loading Animation */
.dot-pulse {
  width: 10px;
  height: 10px;
  border-radius: 5px;
  background-color: #d4af37;
  animation: pulse 1s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
}
</style>
