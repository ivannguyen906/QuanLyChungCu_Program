<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

const props = defineProps(['role', 'userId']);
const notifications = ref([]);
const unreadCount = ref(0);
const showDropdown = ref(false);
const showPopup = ref(false);
const popupData = ref({});

// Hàm lấy thông báo
const fetchNoti = async () => {
  try {
    if (!props.userId) return;
    const type = props.role === 'resident' ? 'resident' : 'user';
    const res = await axios.get(
      `http://103.82.195.119:5000/api/notifications?type=${type}&id=${props.userId}`,
    );

    // Logic hiện Popup khi có tin mới chưa đọc
    const latest = res.data[0];
    if (latest && !latest.is_read && latest.id !== popupData.value.id) {
      triggerPopup(latest);
    }

    notifications.value = res.data;
    unreadCount.value = res.data.filter((n) => !n.is_read).length;
  } catch (e) {}
};

const triggerPopup = (noti) => {
  popupData.value = noti;
  showPopup.value = true;
  setTimeout(() => {
    showPopup.value = false;
  }, 5000); // Tự tắt sau 5s
};

const markRead = async () => {
  showDropdown.value = !showDropdown.value;
  if (showDropdown.value && unreadCount.value > 0) {
    const type = props.role === 'resident' ? 'resident' : 'user';
    await axios.put('http://103.82.195.119:5000/api/notifications/read', {
      type,
      id: props.userId,
    });
    unreadCount.value = 0;
  }
};

let interval;
onMounted(() => {
  fetchNoti();
  interval = setInterval(fetchNoti, 5000); // Quét mỗi 5 giây
});
onUnmounted(() => clearInterval(interval));
</script>

<template>
  <div class="noti-wrapper">
    <div class="bell-icon" @click="markRead">
      🔔
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
    </div>

    <div v-if="showDropdown" class="dropdown">
      <div class="dd-header">Thông báo mới</div>
      <div class="dd-body">
        <div
          v-for="n in notifications"
          :key="n.id"
          :class="['dd-item', n.is_read ? 'read' : 'unread']"
        >
          <strong style="display: block; margin-bottom: 4px">{{
            n.title
          }}</strong>
          <span style="font-size: 13px; color: #4b5563">{{ n.message }}</span>
          <div
            style="
              font-size: 11px;
              color: #9ca3af;
              margin-top: 4px;
              text-align: right;
            "
          >
            {{ new Date(n.created_at).toLocaleTimeString().slice(0, 5) }}
          </div>
        </div>
        <div v-if="notifications.length === 0" class="empty">
          Không có thông báo
        </div>
      </div>
    </div>

    <transition name="slide-fade">
      <div v-if="showPopup" class="toast-popup" @click="showPopup = false">
        <div class="toast-icon">📢</div>
        <div class="toast-content">
          <h4>{{ popupData.title }}</h4>
          <p>{{ popupData.message }}</p>
        </div>
        <button class="toast-close">×</button>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.noti-wrapper {
  position: relative;
  display: inline-block;
}
.bell-icon {
  font-size: 24px;
  cursor: pointer;
  position: relative;
  padding: 5px;
  user-select: none;
}
.badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ef4444;
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  border: 2px solid white;
  font-weight: bold;
}

/* Dropdown */
.dropdown {
  position: absolute;
  right: -10px;
  top: 45px;
  width: 320px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  z-index: 1000;
  overflow: hidden;
}
.dd-header {
  padding: 12px 16px;
  background: #f9fafb;
  font-weight: 700;
  border-bottom: 1px solid #e5e7eb;
  color: #1f2937;
}
.dd-body {
  max-height: 350px;
  overflow-y: auto;
}
.dd-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: 0.2s;
}
.dd-item:hover {
  background: #f8fafc;
}
.dd-item.unread {
  background: #eff6ff;
  border-left: 3px solid #2563eb;
}
.empty {
  padding: 30px;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
}

/* Popup Toast */
.toast-popup {
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border-left: 5px solid #2563eb;
  display: flex;
  gap: 15px;
  align-items: flex-start;
  z-index: 9999;
  max-width: 350px;
  cursor: pointer;
  animation: slideIn 0.3s ease-out;
}
.toast-icon {
  font-size: 20px;
}
.toast-content h4 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #1f2937;
  font-weight: 700;
}
.toast-content p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}
.toast-close {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #9ca3af;
  margin-left: auto;
}

/* Animation */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.5s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
</style>
