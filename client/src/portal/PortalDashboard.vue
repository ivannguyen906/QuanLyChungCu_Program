<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

// Copy logic lấy số liệu từ file cũ sang
const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));
const unpaidCount = ref(0);
const newNotiCount = ref(0);

const fetchDashboardData = async () => {
  if (!user.value.id) return;
  try {
    const resBill = await axios.get(
      `http://103.82.195.119:5000/api/my-bills/${user.value.apartment_id}`,
    );
    unpaidCount.value = resBill.data.filter(
      (b) => b.status === 'unpaid',
    ).length;
    const resNoti = await axios.get(
      'http://103.82.195.119:5000/api/announcements',
    );
    newNotiCount.value = resNoti.data.length > 0 ? 3 : 0;
  } catch (e) {}
};

onMounted(fetchDashboardData);
</script>

<template>
  <div class="dashboard-content">
    <div class="dashboard-grid">
      <div class="stat-card bill-card">
        <div class="card-icon bill-icon">⚡</div>
        <div class="card-info">
          <h3>Hóa đơn chưa đóng</h3>
          <div class="number">{{ unpaidCount }}</div>
          <small v-if="unpaidCount > 0" style="color: #ef4444"
            >Vui lòng thanh toán sớm</small
          >
          <small v-else style="color: #10b981">Bạn đã thanh toán đủ</small>
        </div>
      </div>
      <div class="stat-card noti-card">
        <div class="card-icon noti-icon">📢</div>
        <div class="card-info">
          <h3>Thông báo mới</h3>
          <div class="number">Có tin mới</div>
          <small>Cập nhật từ Ban Quản Lý</small>
        </div>
      </div>
    </div>

    <div class="welcome-box">
      <div class="welcome-icon">👋</div>
      <div class="welcome-content">
        <h3>Xin chào, {{ user.full_name }}</h3>
        <p>
          Chào mừng bạn đến với cổng thông tin cư dân trực tuyến. Căn hộ của bạn
          là <strong>{{ user.apartment_code || 'Chưa cập nhật' }}</strong
          >.
        </p>
        <p>
          Tại đây bạn có thể xem hóa đơn, gửi yêu cầu sửa chữa và nhận thông báo
          nhanh nhất từ ban quản lý.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Copy CSS liên quan đến Dashboard Cards và Welcome Box sang đây */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}
.stat-card {
  background: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid #f1f5f9;
  transition: 0.3s;
}
.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
}
.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}
.bill-icon {
  background: #fff7ed;
  color: #ea580c;
}
.noti-icon {
  background: #eff6ff;
  color: #2563eb;
}
.card-info h3 {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}
.card-info .number {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 5px 0;
}
.welcome-box {
  background: white;
  padding: 30px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  border: 1px solid #f1f5f9;
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.welcome-icon {
  font-size: 40px;
}
.welcome-content h3 {
  margin: 0 0 10px 0;
  font-size: 20px;
  color: #0f172a;
}
.welcome-content p {
  color: #475569;
  line-height: 1.6;
  margin: 5px 0;
}
</style>
