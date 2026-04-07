<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const apartments = ref([]);
const residents = ref([]);
const showModal = ref(false);
const showSvcModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);
const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));

// Tìm kiếm
const searchQuery = ref('');
const showOwnerSuggestions = ref(false);

// Form
const form = ref({
  floor: 1,
  area: 70,
  status: 'chua_ban',
  owner_name: '',
  price: 0,
  image: '',
});
const svcForm = ref([]);
const currentAptCode = ref('');

// --- FETCH DATA ---
const fetchData = async () => {
  try {
    const [resApt, resRes] = await Promise.all([
      axios.get('http://localhost:3000/api/apartments'),
      axios.get('http://localhost:3000/api/residents'),
    ]);
    apartments.value = resApt.data;
    residents.value = resRes.data;
  } catch (e) {}
};

const formatMoney = (n) => {
  // Nếu n là undefined, null hoặc 0, có thể do tên biến truyền vào bị sai (ví dụ n.price thay vì n.rental_price)
  if (n === undefined || n === null || n === 0) return 'Chưa cập nhật';

  return Number(n).toLocaleString('vi-VN') + ' đ / tháng';
};

const formatStatus = (status) => {
  const map = {
    con_trong: 'Còn trống',
    dat_coc: 'Đã đặt cọc',
    cho_thue: 'Đang cho thuê',
    chua_ban: 'Còn trống',
  };
  return map[status] || 'Không xác định';
};

// --- LOGIC GỢI Ý CHỦ HỘ ---
const filteredOwners = computed(() => {
  if (!form.value.owner_name) return residents.value.slice(0, 5);
  const lower = form.value.owner_name.toLowerCase();
  return residents.value
    .filter(
      (r) =>
        r.full_name.toLowerCase().includes(lower) || r.phone.includes(lower),
    )
    .slice(0, 5);
});
const selectOwner = (name) => {
  form.value.owner_name = name;
  showOwnerSuggestions.value = false;
};

// --- LOGIC LỌC CĂN HỘ ---
const filteredApartments = computed(() => {
  if (!searchQuery.value) return apartments.value;
  const lower = searchQuery.value.toLowerCase();
  return apartments.value.filter(
    (apt) =>
      apt.apartment_code.toLowerCase().includes(lower) ||
      (apt.owner_name && apt.owner_name.toLowerCase().includes(lower)),
  );
});

// --- CRUD LOGIC (FIX LỖI UPDATE) ---
const openEdit = (apt) => {
  isEditing.value = true;
  currentId.value = apt.id;
  // Fix: Đảm bảo price và image không bị undefined khi bind vào form
  form.value = {
    ...apt,
    price: apt.price ? apt.price : 0,
    image: apt.image ? apt.image : '',
  };
  showModal.value = true;
  showOwnerSuggestions.value = false;
};

const handleSave = async () => {
  try {
    // Ép kiểu về số để tránh lỗi string
    form.value.price = Number(form.value.price);

    if (isEditing.value)
      await axios.put(
        `http://localhost:3000/api/apartments/${currentId.value}`,
        form.value,
      );
    else await axios.post('http://localhost:3000/api/apartments', form.value);

    showModal.value = false;
    fetchData(); // Load lại bảng ngay lập tức
  } catch (e) {
    alert(e.message);
  }
};

const handleDelete = async (id, code) => {
  if (confirm('Bạn có chắc chắn muốn xóa căn hộ này không?')) {
    await axios.delete(`http://localhost:3000/api/apartments/${id}`);
    fetchData();
  }
};

// --- SERVICE LOGIC ---
const openServiceConfig = async (apt) => {
  currentId.value = apt.id;
  currentAptCode.value = apt.apartment_code;
  try {
    const res = await axios.get(
      `http://localhost:3000/api/apartments/${apt.id}/services`,
    );
    svcForm.value = res.data;
    showSvcModal.value = true;
  } catch (e) {
    alert('Lỗi tải dịch vụ');
  }
};

const handleSaveServices = async () => {
  try {
    await axios.post(
      `http://localhost:3000/api/apartments/${currentId.value}/services`,
      svcForm.value,
    );
    showSvcModal.value = false;
    alert('Đã cập nhật dịch vụ cho căn ' + currentAptCode.value);
  } catch (e) {
    alert('Lỗi lưu');
  }
};

const logout = () => {
  localStorage.removeItem('user_info');
  router.push('/login');
};

onMounted(() => {
  if (!user.value.username) router.push('/login');
  fetchData();
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
        <router-link to="/apartments" class="nav-item active"
          >🏢 Căn hộ</router-link
        >
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
          <h1>Quản lý Căn hộ</h1>
          <p>Danh sách toàn bộ căn hộ trong dự án</p>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input
              v-model="searchQuery"
              placeholder="Tìm mã phòng hoặc chủ hộ..."
            />
          </div>
          <button
            @click="
              showModal = true;
              isEditing = false;
              form = {
                floor: 1,
                area: 70,
                status: 'chua_ban',
                owner_name: '',
                price: 0,
                image: '',
              };
            "
            class="btn-primary"
          >
            + Thêm Căn Hộ
          </button>
        </div>
      </header>

      <div class="content-card">
        <table class="data-table">
          <thead>
            <tr>
              <th width="80">Ảnh</th>
              <th>Mã căn</th>
              <th>Diện tích</th>
              <th>Giá trị</th>
              <th>Chủ hộ</th>
              <th>Trạng thái</th>
              <th style="text-align: right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="apt in filteredApartments" :key="apt.id">
              <td>
                <img
                  :src="apt.image || 'https://via.placeholder.com/50?text=Img'"
                  class="apt-thumb"
                  alt="Apt"
                  onerror="this.src = 'https://via.placeholder.com/50?text=Err'"
                />
              </td>
              <td class="code">{{ apt.apartment_code }}</td>
              <td style="color: #64748b">{{ apt.area }} m²</td>
              <td style="font-weight: 600; color: var(--dark)">
                {{ formatMoney(apt.rental_price) }}
              </td>
              <td style="font-weight: 500">{{ apt.owner_name || '---' }}</td>
              <td>
                <span :class="['badge', apt.status]">{{
                  formatStatus(apt.status)
                }}</span>
              </td>
              <td style="text-align: right">
                <div class="action-group">
                  <button
                    @click="openServiceConfig(apt)"
                    class="btn-icon svc"
                    title="Dịch vụ"
                  >
                    🛠️
                  </button>
                  <button
                    @click="openEdit(apt)"
                    class="btn-icon edit"
                    title="Sửa"
                  >
                    ✏️
                  </button>
                  <button
                    @click="handleDelete(apt.id, apt.apartment_code)"
                    class="btn-icon delete"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="filteredApartments.length === 0">
              <td colspan="7" class="empty-text">
                Không tìm thấy kết quả phù hợp
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Cập nhật Căn hộ' : 'Thêm Căn hộ Mới' }}</h3>
          <button @click="showModal = false" class="close-btn">×</button>
        </div>

        <div class="form-body">
          <div class="form-row">
            <div class="form-group half">
              <label>Tầng</label>
              <input type="number" v-model="form.floor" />
            </div>
            <div class="form-group half">
              <label>Diện tích (m²)</label>
              <input type="number" v-model="form.area" />
            </div>
          </div>

          <div class="form-group">
            <label>Giá thuê (VNĐ/tháng)</label>
            <input
              type="number"
              v-model="form.price"
              placeholder="Nhập số tiền..."
            />
          </div>

          <div class="form-group">
            <label>Link Hình ảnh (URL)</label>
            <input type="text" v-model="form.image" placeholder="https://..." />
            <div v-if="form.image" class="img-preview">
              <img :src="form.image" @error="form.image = ''" alt="Preview" />
            </div>
          </div>

          <div class="form-group">
            <label>Trạng thái</label>
            <select v-model="form.status">
              <option value="chua_ban">Còn trống</option>
              <option value="dat_coc">Đã đặt cọc</option>
              <option value="cho_thue">Đang cho thuê</option>
            </select>
          </div>

          <div class="form-group" style="position: relative">
            <label>Chủ hộ (Nhập tên/SĐT để tìm)</label>
            <input
              v-model="form.owner_name"
              @focus="showOwnerSuggestions = true"
              placeholder="VD: Nguyễn Văn A..."
              autocomplete="off"
            />
            <ul v-if="showOwnerSuggestions" class="suggestions-list">
              <li
                v-for="r in filteredOwners"
                :key="r.id"
                @click="selectOwner(r.full_name)"
              >
                <div class="sug-name">{{ r.full_name }}</div>
                <small>{{ r.phone }}</small>
              </li>
              <li class="close-sug" @click="showOwnerSuggestions = false">
                Đóng gợi ý
              </li>
            </ul>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="showModal = false" class="btn-outline">Hủy bỏ</button>
          <button @click="handleSave" class="btn-primary">Lưu thông tin</button>
        </div>
      </div>
    </div>

    <div v-if="showSvcModal" class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Dịch vụ căn {{ currentAptCode }}</h3>
          <button @click="showSvcModal = false" class="close-btn">×</button>
        </div>
        <p class="modal-desc">
          Nhập số lượng sử dụng (VD: 2 xe máy, 10 khối nước...)
        </p>
        <div class="svc-list">
          <div v-for="s in svcForm" :key="s.id" class="svc-item">
            <div class="svc-info">
              <strong>{{ s.name }}</strong>
              <small
                >{{ Number(s.price).toLocaleString() }}đ / {{ s.unit }}</small
              >
            </div>
            <input
              type="number"
              v-model="s.quantity"
              min="0"
              class="qty-input"
            />
          </div>
          <div v-if="svcForm.length === 0" class="empty-text">
            Chưa cấu hình danh sách dịch vụ
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showSvcModal = false" class="btn-outline">
            Đóng
          </button>
          <button @click="handleSaveServices" class="btn-primary">
            Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* CSS LAYOUT */
.app-layout {
  display: flex;
  height: 100vh;
  background: var(--light);
  color: var(--dark);
  font-family: 'Inter', sans-serif;
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

/* CONTENT */
.main-content {
  flex: 1;
  padding: 30px 40px;
  overflow-y: auto;
}
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
.header-actions {
  display: flex;
  gap: 15px;
}
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}
.search-box input {
  padding: 12px 12px 12px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 280px;
  outline: none;
  transition: 0.2s;
  font-family: var(--font-body);
}
.search-box input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.1);
}
.search-icon {
  position: absolute;
  left: 12px;
  color: #94a3b8;
}
.btn-primary {
  background: linear-gradient(180deg, var(--primary) 0%, #b5952f 100%);
  color: var(--white);
  border: none;
  padding: 10px 25px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: 0.2s;
}
.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* TABLE */
.content-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
}
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}
.data-table th {
  text-align: left;
  padding: 15px;
  color: var(--dark);
  border-bottom: 2px solid #f1f5f9;
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 15px;
}
.data-table td {
  padding: 15px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #334155;
  transition: 0.2s;
}
.data-table tr:hover td {
  background: #f8fafc;
}
.code {
  color: var(--primary);
  font-weight: 700;
  font-family: monospace;
  font-size: 14px;
}
.apt-thumb {
  width: 50px;
  height: 50px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid #e2e8f0;
}
.badge {
  padding: 6px 12px;
  border-radius: 30px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}
.badge.chua_ban {
  background: #f1f5f9;
  color: #64748b;
}
.badge.da_ban {
  background: #dcfce7;
  color: #16a34a;
}
.badge.dat_coc {
  background: #fef9c3;
  color: #ca8a04;
}
.badge.cho_thue {
  background: #dbeafe;
  color: #2563eb;
}
.action-group {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.2s;
}
.btn-icon.svc {
  background: #fff7ed;
  color: #ea580c;
}
.btn-icon.edit {
  background: #eff6ff;
  color: #2563eb;
}
.btn-icon.delete {
  background: #fef2f2;
  color: #ef4444;
}
.btn-icon:hover {
  transform: scale(1.1);
}

/* MODAL */
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
  width: 450px;
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
  max-height: 90vh;
  overflow-y: auto;
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
  padding: 20px 25px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--dark);
}
.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
}
.form-body {
  padding: 25px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.form-row {
  display: flex;
  gap: 15px;
}
.form-group.half {
  flex: 1;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-family: var(--font-body);
  box-sizing: border-box;
}
.img-preview {
  margin-top: 10px;
  width: 100%;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}
.img-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.modal-footer {
  padding: 20px 25px;
  border-top: 1px solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #f8fafc;
  border-radius: 0 0 12px 12px;
}
.btn-outline {
  background: white;
  border: 1px solid #cbd5e1;
  color: #475569;
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}
.btn-outline:hover {
  background: #f1f5f9;
}

/* SERVICES & SUGGESTIONS */
.svc-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 0 25px 25px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.modal-desc {
  padding: 0 25px 15px;
  color: #64748b;
  font-size: 13px;
  margin: 0;
}
.svc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
}
.svc-info strong {
  display: block;
  font-size: 14px;
  color: var(--dark);
}
.svc-info small {
  color: #64748b;
  font-size: 12px;
}
.qty-input {
  width: 70px;
  text-align: center;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  padding: 5px;
}
.suggestions-list {
  position: absolute;
  top: 70px;
  left: 0;
  width: 100%;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 0;
  margin: 0;
  z-index: 10;
  max-height: 180px;
  overflow-y: auto;
}
.suggestions-list li {
  padding: 10px 15px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
}
.suggestions-list li:hover {
  background: #f8fafc;
  color: var(--primary);
}
.sug-name {
  font-weight: 600;
  font-size: 13px;
}
.close-sug {
  color: #ef4444 !important;
  font-weight: 600;
  justify-content: center;
  text-align: center;
}
</style>
