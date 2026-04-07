<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const announcements = ref([]);
const selectedNews = ref(null);
const showModal = ref(false);

// --- FETCH DATA ---
const fetchData = async () => {
  try {
    const res = await axios.get('http://103.82.195.119:5000/api/announcements');
    // Sắp xếp mới nhất lên đầu
    announcements.value = res.data.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at),
    );
  } catch (e) {
    console.error(e);
  }
};

// --- HELPERS ---
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

// Kiểm tra xem tin có mới không (trong vòng 3 ngày)
const isNew = (date) => {
  const now = new Date();
  const newsDate = new Date(date);
  const diffTime = Math.abs(now - newsDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 3;
};

// --- ACTIONS ---
const openDetail = (news) => {
  selectedNews.value = news;
  showModal.value = true;
};

onMounted(fetchData);
</script>

<template>
  <div class="portal-container">
    <div class="page-header">
      <h2>Thông báo Tòa nhà</h2>
      <p>Cập nhật tin tức mới nhất từ Ban Quản Lý</p>
    </div>

    <div class="news-list">
      <div
        v-for="news in announcements"
        :key="news.id"
        class="news-card"
        @click="openDetail(news)"
      >
        <div class="news-icon-box">
          <span class="icon">📢</span>
        </div>

        <div class="news-content">
          <div class="news-meta">
            <span class="date">{{ formatDate(news.created_at) }}</span>
            <span v-if="isNew(news.created_at)" class="badge-new">MỚI</span>
          </div>
          <h3 class="news-title">{{ news.title }}</h3>
          <p class="news-excerpt">{{ news.content }}</p>
        </div>

        <div class="arrow-icon">➝</div>
      </div>

      <div v-if="announcements.length === 0" class="empty-state">
        <p>Hiện chưa có thông báo nào.</p>
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
      <div class="modal-box">
        <div class="modal-header">
          <span class="modal-date">{{
            formatDate(selectedNews?.created_at)
          }}</span>
          <button @click="showModal = false" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <h3 class="modal-title">{{ selectedNews?.title }}</h3>
          <div class="modal-content">
            {{ selectedNews?.content }}
          </div>
          <div class="modal-signature">
            <p>Trân trọng,</p>
            <strong>Ban Quản Lý Tòa Nhà</strong>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" class="btn-primary">
            Đã hiểu
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.portal-container {
  animation: fadeUp 0.4s ease-out;
}
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-header {
  margin-bottom: 25px;
}
.page-header h2 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 24px;
  color: var(--dark);
}
.page-header p {
  margin: 5px 0 0;
  color: var(--gray);
  font-size: 14px;
}

/* NEWS LIST STYLE */
.news-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.news-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  border: 1px solid #f1f5f9;
  display: flex;
  gap: 20px;
  align-items: flex-start;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}
.news-card:hover {
  transform: translateX(5px);
  border-color: var(--primary);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}
.news-card:hover .arrow-icon {
  opacity: 1;
  transform: translateX(0);
}

/* ICON BOX */
.news-icon-box {
  width: 50px;
  height: 50px;
  background: #fff7ed;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.icon {
  font-size: 24px;
}

/* CONTENT */
.news-content {
  flex: 1;
  overflow: hidden;
}
.news-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}
.date {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 500;
}
.badge-new {
  background: #ef4444;
  color: white;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  animation: pulse 2s infinite;
}

.news-title {
  margin: 0 0 5px 0;
  font-size: 16px;
  color: var(--dark);
  font-weight: 700;
}
.news-excerpt {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis; /* Cắt chữ nếu dài quá */
}

.arrow-icon {
  font-size: 20px;
  color: var(--primary);
  opacity: 0;
  transform: translateX(-10px);
  transition: 0.3s;
  align-self: center;
}

/* MODAL STYLE */
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
  display: flex;
  flex-direction: column;
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
.modal-date {
  color: #94a3b8;
  font-size: 13px;
  font-weight: 600;
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
}
.modal-title {
  margin: 0 0 15px 0;
  font-size: 20px;
  color: var(--primary);
  line-height: 1.4;
}
.modal-content {
  color: #334155;
  line-height: 1.6;
  font-size: 15px;
  white-space: pre-line;
} /* pre-line để giữ xuống dòng */
.modal-signature {
  margin-top: 30px;
  text-align: right;
  color: var(--dark);
  font-size: 14px;
}

.modal-footer {
  padding: 15px 25px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  background: #f8fafc;
  border-radius: 0 0 12px 12px;
}
.btn-primary {
  background: var(--dark);
  color: white;
  border: none;
  padding: 8px 25px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-style: italic;
  background: white;
  border-radius: 12px;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}
</style>
