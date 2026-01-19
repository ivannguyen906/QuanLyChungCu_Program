<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));

// Dữ liệu thống kê
const stats = ref({
  total_apartments: 0,
  total_residents: 0,
  total_revenue: 0,
  chart_status: [],
  chart_revenue: [],
});

// Thời gian thực
const currentTime = ref('');
let timerInterval = null;

const fetchStats = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/dashboard/stats');
    stats.value = res.data.data;
  } catch (e) {
    console.error(e);
  }
};

const logout = () => {
  localStorage.removeItem('user_info');
  router.push('/login');
};

const formatMoney = (n) => Number(n).toLocaleString('vi-VN');

// --- LOGIC ĐỒNG HỒ ---
const updateTime = () => {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dateStr = now.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  currentTime.value = `${timeStr} - ${dateStr}`;
};

// --- TÍNH TOÁN BIỂU ĐỒ ĐƯỜNG (SVG) ---
const chartData = computed(() => {
  if (!stats.value.chart_revenue || stats.value.chart_revenue.length === 0)
    return [];

  const data = stats.value.chart_revenue;
  const maxVal = Math.max(...data.map((d) => d.total)) || 1;
  const width = 100; // 100% viewbox width
  const height = 100; // 100% viewbox height

  // Tạo tọa độ X, Y cho từng điểm
  return data.map((item, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - (item.total / maxVal) * 0.8 * height; // Nhân 0.8 để chừa khoảng trống trên đầu
    return { x, y, val: item.total, label: `T${item.month}` };
  });
});

// Tạo đường Line (Polyline points)
const svgPoints = computed(() => {
  return chartData.value.map((p) => `${p.x},${p.y}`).join(' ');
});

// Tạo vùng màu nền (Gradient Area)
const svgArea = computed(() => {
  if (chartData.value.length === 0) return '';
  const first = chartData.value[0];
  const last = chartData.value[chartData.value.length - 1];
  return `${first.x},100 ${svgPoints.value} ${last.x},100`;
});

// --- LOGIC TRẠNG THÁI CĂN HỘ ---
const totalAptCount = computed(() => stats.value.total_apartments || 1);
const getStatusCount = (statusKey) => {
  const found = stats.value.chart_status?.find((s) => s.status === statusKey);
  return found ? found.count : 0;
};
const getStatusPercent = (statusKey) => {
  return (
    ((getStatusCount(statusKey) / totalAptCount.value) * 100).toFixed(1) + '%'
  );
};

onMounted(() => {
  if (!user.value.id) router.push('/login');
  fetchStats();
  updateTime();
  timerInterval = setInterval(updateTime, 1000); // Cập nhật mỗi giây
});

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval);
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
        <router-link to="/dashboard" class="nav-item active"
          >🏠 Tổng quan</router-link
        >
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
        <div>
          <h1>Xin chào, {{ user.full_name }} 👋</h1>
          <p>Hệ thống vận hành ổn định. Chúc bạn một ngày tốt lành!</p>
        </div>
        <div class="time-badge">
          <span class="pulse-dot"></span>
          <span>{{ currentTime }}</span>
        </div>
      </header>

      <div class="stats-grid">
        <div class="stat-card gold-glow">
          <div class="card-icon">🏢</div>
          <div class="card-info">
            <h3>{{ stats.total_apartments }}</h3>
            <p>Tổng căn hộ</p>
          </div>
        </div>
        <div class="stat-card blue-glow">
          <div class="card-icon">👥</div>
          <div class="card-info">
            <h3>{{ stats.total_residents }}</h3>
            <p>Cư dân hiện hữu</p>
          </div>
        </div>
        <div class="stat-card green-glow">
          <div class="card-icon">💰</div>
          <div class="card-info">
            <h3>{{ formatMoney(stats.total_revenue) }} đ</h3>
            <p>Doanh thu thực tế</p>
          </div>
        </div>
      </div>

      <div class="dashboard-widgets">
        <div class="widget revenue-widget">
          <div class="widget-header">
            <h3>Biểu đồ doanh thu</h3>
            <small>Xu hướng theo tháng (Dạng đường)</small>
          </div>

          <div class="chart-wrapper">
            <div v-if="chartData.length === 0" class="no-data">
              Chưa có dữ liệu
            </div>

            <svg
              v-else
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              class="svg-chart"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="#D4AF37" stop-opacity="0.4" />
                  <stop offset="100%" stop-color="#D4AF37" stop-opacity="0" />
                </linearGradient>
              </defs>

              <line
                x1="0"
                y1="25"
                x2="100"
                y2="25"
                stroke="#f1f5f9"
                stroke-width="0.5"
              />
              <line
                x1="0"
                y1="50"
                x2="100"
                y2="50"
                stroke="#f1f5f9"
                stroke-width="0.5"
              />
              <line
                x1="0"
                y1="75"
                x2="100"
                y2="75"
                stroke="#f1f5f9"
                stroke-width="0.5"
              />

              <polygon :points="svgArea" fill="url(#chartGradient)" />

              <polyline
                :points="svgPoints"
                fill="none"
                stroke="#D4AF37"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="chart-line"
              />

              <circle
                v-for="(p, i) in chartData"
                :key="i"
                :cx="p.x"
                :cy="p.y"
                r="2.5"
                fill="#fff"
                stroke="#D4AF37"
                stroke-width="1.5"
                class="chart-dot"
              >
                <title>{{ p.label }}: {{ formatMoney(p.val) }} đ</title>
              </circle>
            </svg>

            <div class="chart-labels" v-if="chartData.length > 0">
              <span
                v-for="(p, i) in chartData"
                :key="i"
                :style="{ left: p.x + '%' }"
                >{{ p.label }}</span
              >
            </div>
          </div>
        </div>

        <div class="widget status-widget">
          <div class="widget-header">
            <h3>Tình trạng dự án</h3>
            <small>Tổng quan lấp đầy</small>
          </div>
          <div class="status-list">
            <div class="status-item">
              <div class="st-label">
                <span>Đã bán / Có chủ</span>
                <strong>{{ getStatusCount('da_ban') }} căn</strong>
              </div>
              <div class="progress-bg">
                <div
                  class="progress-fill sold"
                  :style="{ width: getStatusPercent('da_ban') }"
                ></div>
              </div>
            </div>
            <div class="status-item">
              <div class="st-label">
                <span>Đã đặt cọc</span>
                <strong>{{ getStatusCount('dat_coc') }} căn</strong>
              </div>
              <div class="progress-bg">
                <div
                  class="progress-fill deposit"
                  :style="{ width: getStatusPercent('dat_coc') }"
                ></div>
              </div>
            </div>
            <div class="status-item">
              <div class="st-label">
                <span>Đang cho thuê</span>
                <strong>{{ getStatusCount('cho_thue') }} căn</strong>
              </div>
              <div class="progress-bg">
                <div
                  class="progress-fill rent"
                  :style="{ width: getStatusPercent('cho_thue') }"
                ></div>
              </div>
            </div>
            <div class="status-item">
              <div class="st-label">
                <span>Còn trống</span>
                <strong>{{ getStatusCount('chua_ban') }} căn</strong>
              </div>
              <div class="progress-bg">
                <div
                  class="progress-fill empty"
                  :style="{ width: getStatusPercent('chua_ban') }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h3 class="section-title">Truy cập nhanh</h3>
      <div class="quick-actions">
        <div class="action-btn" @click="router.push('/apartments')">
          <span class="ac-icon">🔑</span>
          <span>Cấp căn hộ mới</span>
        </div>
        <div class="action-btn" @click="router.push('/bills')">
          <span class="ac-icon">🧾</span>
          <span>Tạo hóa đơn</span>
        </div>
        <div class="action-btn" @click="router.push('/announcements')">
          <span class="ac-icon">📢</span>
          <span>Soạn thông báo</span>
        </div>
        <div class="action-btn" @click="router.push('/leads')">
          <span class="ac-icon">📞</span>
          <span>Gọi khách hàng</span>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* --- LAYOUT --- */
.app-layout {
  display: flex;
  height: 100vh;
  background: var(--light);
  color: var(--dark);
}

/* --- SIDEBAR --- */
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

/* HEADER (TIME BADGE) */
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

.time-badge {
  padding: 8px 16px;
  background: white;
  border-radius: 30px;
  font-weight: 600;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  color: var(--dark);
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: monospace; /* Font monospace cho số giờ nhảy đều */
  font-size: 14px;
}
.pulse-dot {
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
  }
}

/* STATS CARDS */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
  margin-bottom: 30px;
}
.stat-card {
  background: white;
  padding: 25px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
  transition: 0.3s;
  position: relative;
  overflow: hidden;
}
.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08);
}
.gold-glow::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--primary);
}
.blue-glow::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #3b82f6;
}
.green-glow::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: #10b981;
}
.card-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: #f8fafc;
}
.card-info h3 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  font-family: var(--font-heading);
}
.card-info p {
  margin: 0;
  color: var(--gray);
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* WIDGETS & CHART */
.dashboard-widgets {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 25px;
  margin-bottom: 40px;
}
.widget {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
}
.widget-header {
  margin-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 10px;
}
.widget-header h3 {
  margin: 0;
  font-size: 18px;
}
.widget-header small {
  color: var(--gray);
}

/* SVG CHART STYLES */
.chart-wrapper {
  position: relative;
  height: 250px;
  padding-bottom: 20px;
}
.svg-chart {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.chart-line {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawLine 2s ease-out forwards;
  filter: drop-shadow(0 4px 6px rgba(212, 175, 55, 0.3));
}
@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}
.chart-dot {
  transition: r 0.3s;
  cursor: pointer;
}
.chart-dot:hover {
  r: 6;
}
.chart-labels {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 20px;
}
.chart-labels span {
  position: absolute;
  transform: translateX(-50%);
  font-size: 12px;
  color: var(--gray);
}
.no-data {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #ccc;
}

/* STATUS LIST */
.status-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.st-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 5px;
}
.progress-bg {
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  border-radius: 4px;
}
.progress-fill.sold {
  background: #10b981;
}
.progress-fill.deposit {
  background: #f59e0b;
}
.progress-fill.rent {
  background: #3b82f6;
}
.progress-fill.empty {
  background: #e2e8f0;
}

/* QUICK ACTIONS */
.section-title {
  font-size: 18px;
  margin-bottom: 20px;
}
.quick-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.action-btn {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: 0.2s;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
}
.action-btn:hover {
  transform: translateY(-3px);
  border-color: var(--primary);
  box-shadow: 0 10px 15px rgba(212, 175, 55, 0.1);
}
.ac-icon {
  font-size: 24px;
}
.action-btn span:last-child {
  font-weight: 600;
  font-size: 14px;
}
</style>
