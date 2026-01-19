<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const services = ref([]);
const searchQuery = ref('');

const fetchServices = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/services');
    services.value = res.data;
  } catch (e) {}
};

const filteredServices = computed(() => {
  if (!searchQuery.value) return services.value;
  const lower = searchQuery.value.toLowerCase();
  return services.value.filter((s) => s.name.toLowerCase().includes(lower));
});

const formatMoney = (n) => Number(n).toLocaleString('vi-VN');

const getIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes('điện')) return '⚡';
  if (n.includes('nước')) return '💧';
  if (n.includes('xe') || n.includes('oto') || n.includes('máy')) return '🛵';
  if (n.includes('wifi') || n.includes('net')) return '📶';
  if (n.includes('quản lý')) return '🏢';
  if (n.includes('vệ sinh')) return '🧹';
  return '💎';
};

onMounted(fetchServices);
</script>

<template>
  <div class="portal-container">
    <div class="page-header">
      <div class="header-text">
        <h2>Bảng giá Dịch vụ</h2>
        <p>Niêm yết đơn giá vận hành tòa nhà</p>
      </div>

      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          placeholder="Tìm dịch vụ (VD: điện, nước...)"
        />
      </div>
    </div>

    <div class="services-grid">
      <div v-for="s in filteredServices" :key="s.id" class="service-card">
        <div class="card-icon">{{ getIcon(s.name) }}</div>
        <div class="card-info">
          <h3 class="svc-name">{{ s.name }}</h3>
          <div class="svc-price-block">
            <span class="price">{{ formatMoney(s.price) }}</span>
            <span class="unit">₫ / {{ s.unit }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="filteredServices.length === 0" class="empty-state">
      <p>Không tìm thấy kết quả nào.</p>
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

/* HEADER FIX */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center; /* Căn giữa theo chiều dọc */
  margin-bottom: 30px;
  background: white;
  padding: 20px 25px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  border: 1px solid #f1f5f9;
}

.header-text h2 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 20px;
  color: var(--dark);
}
.header-text p {
  margin: 4px 0 0;
  color: var(--gray);
  font-size: 13px;
}

/* SEARCH BOX FIX */
.search-box {
  position: relative;
  width: 320px;
}
.search-box input {
  width: 100%;
  padding: 10px 15px 10px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  outline: none;
  transition: 0.2s;
  font-family: var(--font-body);
  font-size: 14px;
  box-sizing: border-box; /* Quan trọng để không bị vỡ layout */
}
.search-box input:focus {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}
.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  font-size: 14px;
}

/* GRID LAYOUT FIX */
.services-grid {
  display: grid;
  grid-template-columns: repeat(
    auto-fill,
    minmax(260px, 1fr)
  ); /* Tự động xuống dòng */
  gap: 20px;
}

/* SERVICE CARD FIX */
.service-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.02);
  border: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 15px;
  transition: all 0.3s ease;
}
.service-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  border-color: var(--primary);
}

.card-icon {
  width: 50px;
  height: 50px;
  background: #f8fafc;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: var(--primary);
  border: 1px solid #e2e8f0;
}

.card-info {
  flex: 1;
}
.svc-name {
  margin: 0 0 4px 0;
  font-size: 14px;
  color: #475569;
  font-weight: 600;
  text-transform: capitalize;
}

.svc-price-block {
  display: flex;
  align-items: baseline;
  gap: 4px;
}
.price {
  font-size: 18px;
  font-weight: 700;
  color: var(--dark);
}
.unit {
  font-size: 12px;
  color: #94a3b8;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-style: italic;
}
</style>
