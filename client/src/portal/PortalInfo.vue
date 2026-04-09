<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));
const apartment = ref({});
const members = ref([]);

// --- FETCH DATA ---
const fetchData = async () => {
  if (!user.value.apartment_id) return;
  try {
    // 1. Lấy thông tin căn hộ
    const resApt = await axios.get(
      `http://103.82.195.119:5000/api/apartments/${user.value.apartment_id}`,
    );
    apartment.value = resApt.data;

    // 2. Lấy danh sách thành viên
    const resMem = await axios.get(
      `http://103.82.195.119:5000/api/apartments/${user.value.apartment_id}/members`,
    );
    members.value = resMem.data;
  } catch (e) {
    console.error('Lỗi tải thông tin', e);
  }
};

// --- HELPERS ---
const roleText = (isOwner) => (isOwner ? 'Chủ hộ' : 'Thành viên');
const statusText = (st) => {
  const map = {
    con_trong: 'Trống',
    da_ban: 'Đã sở hữu',
    cho_thue: 'Đang thuê',
    dat_coc: 'Đang cọc',
  };
  return map[st] || st;
};

onMounted(fetchData);
</script>

<template>
  <div class="portal-container">
    <div class="page-header">
      <h2>Thông tin & Gia đình</h2>
      <p>Hồ sơ căn hộ và danh sách cư dân đăng ký</p>
    </div>

    <div class="info-grid">
      <div class="info-card apt-card">
        <div class="card-header">
          <h3>🏢 Hồ sơ Căn hộ</h3>
        </div>
        <div class="card-body">
          <div class="apt-image">
            <img
              :src="
                apartment.image ||
                'https://via.placeholder.com/400x200?text=Grand+Marina'
              "
              alt="Apartment"
            />
            <div class="apt-code">{{ apartment.apartment_code }}</div>
          </div>
          <div class="apt-details">
            <div class="detail-row">
              <span>Tầng:</span> <strong>{{ apartment.floor }}</strong>
            </div>
            <div class="detail-row">
              <span>Diện tích:</span> <strong>{{ apartment.area }} m²</strong>
            </div>
            <div class="detail-row">
              <span>Trạng thái:</span>
              <span class="status-tag">{{ statusText(apartment.status) }}</span>
            </div>
            <div class="detail-row">
              <span>Giá trị:</span>
              <strong class="price">{{
                apartment.price
                  ? Number(apartment.price).toLocaleString() + ' đ'
                  : 'Liên hệ'
              }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="info-card mem-card">
        <div class="card-header">
          <h3>👨‍👩‍👧‍👦 Thành viên gia đình ({{ members.length }})</h3>
        </div>
        <div class="card-body members-list">
          <div v-for="mem in members" :key="mem.id" class="member-item">
            <div class="mem-avatar">
              {{ mem.full_name.charAt(0).toUpperCase() }}
            </div>
            <div class="mem-info">
              <div class="mem-name">
                {{ mem.full_name }}
                <span v-if="mem.is_owner" class="owner-badge">👑 Chủ hộ</span>
              </div>
              <div class="mem-phone">{{ mem.phone }}</div>
            </div>
            <div class="mem-action" v-if="user.id === mem.id">
              <span class="me-tag">Là bạn</span>
            </div>
          </div>
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

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 25px;
}
@media (max-width: 900px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

.info-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
  overflow: hidden;
}
.card-header {
  padding: 15px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.card-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--dark);
}

/* APT CARD STYLE */
.apt-image {
  position: relative;
  height: 180px;
  background: #e2e8f0;
}
.apt-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.apt-code {
  position: absolute;
  bottom: 15px;
  left: 15px;
  background: rgba(15, 23, 42, 0.8);
  color: var(--primary);
  padding: 5px 15px;
  border-radius: 4px;
  font-weight: 700;
  backdrop-filter: blur(4px);
}

.apt-details {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #475569;
  border-bottom: 1px dashed #e2e8f0;
  padding-bottom: 8px;
}
.detail-row:last-child {
  border-bottom: none;
}
.detail-row strong {
  color: var(--dark);
}
.status-tag {
  background: #dcfce7;
  color: #16a34a;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}
.price {
  color: var(--primary) !important;
  font-size: 16px;
}

/* MEMBERS STYLE */
.members-list {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  max-height: 400px;
  overflow-y: auto;
}
.member-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  border: 1px solid #f1f5f9;
  border-radius: 8px;
  transition: 0.2s;
}
.member-item:hover {
  background: #f8fafc;
  transform: translateX(5px);
}

.mem-avatar {
  width: 45px;
  height: 45px;
  background: linear-gradient(135deg, var(--primary) 0%, #b5952f 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 18px;
  box-shadow: 0 4px 6px rgba(212, 175, 55, 0.2);
}

.mem-info {
  flex: 1;
}
.mem-name {
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 2px;
}
.mem-phone {
  font-size: 12px;
  color: #94a3b8;
}
.owner-badge {
  background: #fef9c3;
  color: #ca8a04;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  margin-left: 5px;
  border: 1px solid #fde047;
}
.me-tag {
  background: #eff6ff;
  color: #2563eb;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 20px;
  font-weight: 600;
}
</style>
