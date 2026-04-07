<script setup>
import { ref, watch } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

// Dữ liệu Form
const form = ref({
  budget: '',
  members: 1, // Mặc định là 1
  preferences: '',
});

// Biến hiển thị ngân sách có dấu chấm (VD: 5.000.000.000)
const budgetDisplay = ref('');

const results = ref([]);
const isLoading = ref(false);
const searched = ref(false);

// --- LOGIC FORMAT TIỀN KHI NHẬP ---
// Khi người dùng nhập, tự động thêm dấu chấm phân cách
const onBudgetInput = (e) => {
  // 1. Lấy giá trị thô, bỏ hết ký tự không phải số
  let rawValue = e.target.value.replace(/\D/g, '');

  // 2. Cập nhật vào form gửi đi (số nguyên)
  form.value.budget = rawValue;

  // 3. Cập nhật vào ô hiển thị (có dấu chấm)
  if (rawValue) {
    budgetDisplay.value = Number(rawValue).toLocaleString('vi-VN');
  } else {
    budgetDisplay.value = '';
  }
};

// --- LOGIC TĂNG GIẢM THÀNH VIÊN ---
const changeMembers = (amount) => {
  const newVal = Number(form.value.members) + amount;
  if (newVal >= 1 && newVal <= 10) {
    form.value.members = newVal;
  }
};

const goBack = () => {
  router.push('/');
};

const handleSmartSearch = async () => {
  if (!form.value.budget || !form.value.members) {
    return alert('Vui lòng nhập ngân sách và số người ở!');
  }

  isLoading.value = true;
  searched.value = true;
  results.value = [];

  try {
    const res = await axios.post(
      'http://103.82.195.119:5000/api/ai-recommend',
      form.value,
    );
    results.value = res.data;
  } catch (e) {
    console.error(e);
    alert('Có lỗi khi kết nối với AI Server.');
  } finally {
    isLoading.value = false;
  }
};

const formatMoney = (n) => Number(n).toLocaleString('vi-VN') + ' đ';

const getImgUrl = (imgName) => {
  if (imgName && imgName.startsWith('http')) return imgName;
  return 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070&auto=format&fit=crop';
};
</script>

<template>
  <div class="ai-page">
    <div class="bg-decoration"></div>

    <header class="ai-header">
      <div class="logo" @click="goBack">
        <span class="logo-icon">⚜️</span> GRAND MARINA AI
      </div>
      <button @click="goBack" class="btn-back">
        <span class="arrow">←</span> Về Trang Chủ
      </button>
    </header>

    <div class="container">
      <div class="search-section">
        <div class="text-content">
          <h1 class="title">
            Tìm Kiếm Căn Hộ <span class="text-gradient">Thông Minh</span>
          </h1>
          <p class="subtitle">
            Trợ lý AI phân tích hàng triệu dữ liệu để tìm ra tổ ấm hoàn hảo cho
            riêng bạn.
          </p>
        </div>

        <div class="glass-card">
          <div class="input-grid">
            <div class="form-group">
              <label>Ngân sách tối đa (VNĐ)</label>
              <div class="input-wrapper">
                <span class="input-icon">💰</span>
                <input
                  type="text"
                  :value="budgetDisplay"
                  @input="onBudgetInput"
                  placeholder="Ví dụ: 5.000.000.000"
                  class="no-arrow"
                />
              </div>
            </div>

            <div class="form-group">
              <label>Số thành viên</label>
              <div class="counter-wrapper">
                <button @click="changeMembers(-1)" class="btn-counter">
                  -
                </button>
                <input
                  v-model="form.members"
                  type="number"
                  class="input-counter no-arrow"
                  readonly
                />
                <button @click="changeMembers(1)" class="btn-counter">+</button>
              </div>
            </div>
          </div>

          <div class="form-group full-width">
            <label>Mong muốn đặc biệt</label>
            <div class="textarea-wrapper">
              <span class="input-icon top">✨</span>
              <textarea
                v-model="form.preferences"
                rows="2"
                placeholder="Ví dụ: Tôi thích view sông, tầng cao yên tĩnh, nhà có người già cần tránh hướng Tây..."
              ></textarea>
            </div>
          </div>

          <div class="action-area">
            <button
              @click="handleSmartSearch"
              :disabled="isLoading"
              class="btn-ai-search"
            >
              <span v-if="isLoading">🔮 Đang phân tích dữ liệu...</span>
              <span v-else>✨ PHÂN TÍCH & TÌM KIẾM</span>
            </button>
          </div>
        </div>
      </div>

      <div class="results-section">
        <div v-if="isLoading" class="loading-container">
          <div class="pulse-ring"></div>
          <p>AI đang so sánh các căn hộ phù hợp nhất...</p>
        </div>

        <div
          v-if="searched && !isLoading && results.length === 0"
          class="empty-state"
        >
          <div class="empty-icon">🔍</div>
          <h3>Không tìm thấy kết quả</h3>
          <p>Hãy thử điều chỉnh ngân sách hoặc tiêu chí tìm kiếm của bạn.</p>
        </div>

        <div v-if="results.length > 0" class="result-grid">
          <div v-for="(item, index) in results" :key="index" class="apt-card">
            <div class="card-img">
              <img :src="getImgUrl(item.image)" alt="Căn hộ" />
              <div class="match-badge">
                <span class="fire-icon">🔥</span> {{ item.match_score || 95 }}%
                Phù hợp
              </div>
              <div class="overlay-info">
                <span class="price-overlay">{{ formatMoney(item.price) }}</span>
              </div>
            </div>

            <div class="card-body">
              <div class="card-header">
                <h3 class="apt-code">{{ item.apartment_code }}</h3>
                <div class="tags">
                  <span class="tag">{{ item.area }}m²</span>
                  <span class="tag">Tầng {{ item.floor }}</span>
                  <span class="tag">{{ item.direction || 'Đông Nam' }}</span>
                </div>
              </div>

              <div class="ai-insight">
                <div class="ai-avatar">🤖</div>
                <div class="ai-text">
                  <strong>Góc nhìn AI:</strong>
                  "{{
                    item.reason ||
                    'Căn hộ này đáp ứng tốt các tiêu chí về ngân sách và tiện ích mà bạn mong muốn.'
                  }}"
                </div>
              </div>

              <button class="btn-contact">Liên hệ xem nhà ngay</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600&display=swap');

/* --- GIỮ NGUYÊN CSS CŨ --- */
.ai-page {
  min-height: 100vh;
  background-color: #0f172a;
  font-family: 'Inter', sans-serif;
  color: #e2e8f0;
  position: relative;
  overflow-x: hidden;
}
.bg-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  overflow: hidden;
  z-index: 0;
}
.bg-decoration::before,
.bg-decoration::after {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(100px);
  opacity: 0.15;
}
.bg-decoration::before {
  background: #d4af37;
  top: -100px;
  left: -100px;
}
.bg-decoration::after {
  background: #3b82f6;
  bottom: -100px;
  right: -100px;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  position: relative;
  z-index: 10;
}
.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 50px;
  position: relative;
  z-index: 20;
}
.logo {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 700;
  color: #d4af37;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
}
.btn-back {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  padding: 10px 20px;
  border-radius: 30px;
  cursor: pointer;
  transition: 0.3s;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-back:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(-5px);
}
.search-section {
  text-align: center;
  margin: 40px 0 60px;
  animation: fadeInDown 0.8s ease;
}
.title {
  font-family: 'Playfair Display', serif;
  font-size: 48px;
  margin-bottom: 15px;
  color: white;
}
.text-gradient {
  background: linear-gradient(to right, #d4af37, #fcd34d);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle {
  color: #94a3b8;
  font-size: 16px;
  margin-bottom: 40px;
}
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 40px;
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}
.input-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.form-group {
  text-align: left;
}
.form-group label {
  display: block;
  font-size: 13px;
  color: #d4af37;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.input-wrapper,
.textarea-wrapper {
  position: relative;
}
.input-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  opacity: 0.7;
}
.input-icon.top {
  top: 20px;
}
.form-group input,
.form-group textarea {
  width: 100%;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 15px 15px 15px 45px;
  color: white;
  font-size: 15px;
  font-family: 'Inter', sans-serif;
  transition: 0.3s;
  box-sizing: border-box;
}
.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #d4af37;
  background: rgba(0, 0, 0, 0.5);
  box-shadow: 0 0 15px rgba(212, 175, 55, 0.1);
}
.action-area {
  margin-top: 30px;
}
.btn-ai-search {
  background: linear-gradient(135deg, #d4af37 0%, #b5952f 100%);
  color: #0f172a;
  border: none;
  padding: 16px 40px;
  border-radius: 50px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  transition: 0.3s;
  box-shadow: 0 10px 20px rgba(212, 175, 55, 0.2);
  width: 100%;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.btn-ai-search:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 30px rgba(212, 175, 55, 0.3);
  filter: brightness(1.1);
}
.btn-ai-search:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.result-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 30px;
  animation: fadeInUp 0.6s ease;
}
.apt-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  transition: 0.3s;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}
.apt-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(212, 175, 55, 0.2);
}
.card-img {
  height: 220px;
  position: relative;
  overflow: hidden;
}
.card-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: 0.5s;
}
.apt-card:hover .card-img img {
  transform: scale(1.1);
}
.match-badge {
  position: absolute;
  top: 15px;
  left: 15px;
  background: rgba(15, 23, 42, 0.9);
  color: #d4af37;
  padding: 6px 12px;
  border-radius: 20px;
  font-weight: 700;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 5px;
  backdrop-filter: blur(5px);
}
.price-overlay {
  position: absolute;
  bottom: 15px;
  right: 15px;
  background: #d4af37;
  color: #0f172a;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 16px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}
.card-body {
  padding: 25px;
  color: #334155;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
  flex-direction: column;
}
.apt-code {
  margin: 0 0 10px 0;
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  color: #0f172a;
}
.tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tag {
  background: #f1f5f9;
  color: #64748b;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}
.ai-insight {
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%);
  border: 1px dashed #bfdbfe;
  padding: 15px;
  border-radius: 12px;
  margin-bottom: 20px;
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.ai-avatar {
  font-size: 20px;
  background: white;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  flex-shrink: 0;
}
.ai-text {
  font-size: 13px;
  line-height: 1.5;
  color: #475569;
}
.ai-text strong {
  color: #2563eb;
  display: block;
  margin-bottom: 2px;
}
.btn-contact {
  width: 100%;
  padding: 12px;
  background: transparent;
  border: 1px solid #0f172a;
  color: #0f172a;
  font-weight: 700;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.3s;
  text-transform: uppercase;
  font-size: 13px;
}
.btn-contact:hover {
  background: #0f172a;
  color: #d4af37;
}
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.loading-container {
  text-align: center;
  padding: 50px;
  color: #94a3b8;
}
.pulse-ring {
  width: 40px;
  height: 40px;
  border: 3px solid #d4af37;
  border-radius: 50%;
  margin: 0 auto 20px;
  animation: pulse 1.5s infinite;
}
@keyframes pulse {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}
.empty-state {
  text-align: center;
  padding: 50px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  max-width: 500px;
  margin: 0 auto;
}
.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

/* --- CSS FIX: ẨN MŨI TÊN TĂNG GIẢM --- */
.no-arrow::-webkit-outer-spin-button,
.no-arrow::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.no-arrow {
  appearance: textfield; /* Thuộc tính chuẩn */
  -moz-appearance: textfield; /* Firefox */
  -webkit-appearance: textfield; /* Safari/Chrome cũ */
}

/* --- CSS MỚI: BỘ ĐẾM SỐ THÀNH VIÊN --- */
.counter-wrapper {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}
.btn-counter {
  background: transparent;
  border: none;
  color: #d4af37;
  width: 50px;
  height: 50px;
  font-size: 20px;
  cursor: pointer;
  transition: 0.2s;
}
.btn-counter:hover {
  background: rgba(212, 175, 55, 0.1);
  color: #fff;
}
.input-counter {
  flex: 1;
  text-align: center;
  background: transparent !important;
  border: none !important;
  padding: 0 !important;
  font-size: 18px !important;
  font-weight: 700;
}
</style>
