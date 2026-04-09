<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const apartments = ref([]);
const guestForm = ref({ full_name: '', phone: '', email: '', message: '' });
const isSubmitting = ref(false);

// --- 1. CHỨC NĂNG ĐIỀU HƯỚNG SANG AI (MỚI) ---
const navigateToAI = () => {
  router.push('/smart-search');
};

// Format tiền tệ
const formatMoney = (price) => {
  if (price && price > 0) return Number(price).toLocaleString('vi-VN') + ' đ';
  return 'Liên hệ';
};

// Format trạng thái
const formatStatus = (s) =>
  ({
    con_trong: 'Đang mở bán',
    da_ban: 'Đã bán',
    dat_coc: 'Đã cọc',
    cho_thue: 'Cho thuê',
  })[s] || s;

// Lấy danh sách căn hộ từ API
const fetchApartments = async () => {
  try {
    const res = await axios.get('http://103.82.195.119:5000/api/apartments');
    apartments.value = res.data;
  } catch (e) {
    console.error(e);
  }
};

// Gửi form tư vấn
const submitForm = async () => {
  if (!guestForm.value.full_name || !guestForm.value.phone)
    return alert('Vui lòng nhập Tên và SĐT');
  isSubmitting.value = true;
  try {
    await axios.post(
      'http://103.82.195.119:5000/api/guest/register',
      guestForm.value,
    );
    alert('Đăng ký thành công! Chuyên viên sẽ liên hệ lại ngay.');
    guestForm.value = { full_name: '', phone: '', email: '', message: '' };
  } catch (e) {
    alert('Lỗi hệ thống, vui lòng gọi hotline.');
  } finally {
    isSubmitting.value = false;
  }
};

// Scroll mượt
const scrollTo = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
};

onMounted(fetchApartments);
</script>

<template>
  <div class="luxury-landing">
    <link
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;600&display=swap"
      rel="stylesheet"
    />

    <nav class="navbar">
      <div class="container nav-container">
        <div class="brand">
          <span class="logo-icon">⚜️</span>
          <span class="logo-text">GRAND MARINA</span>
        </div>
        <div class="nav-menu">
          <a @click.prevent="scrollTo('home')" href="#">Trang chủ</a>
          <a @click.prevent="scrollTo('about')" href="#">Tổng quan</a>
          <a @click.prevent="scrollTo('products')" href="#">Căn hộ</a>
          <a @click.prevent="scrollTo('contact')" href="#">Liên hệ</a>
        </div>
        <button @click="router.push('/login')" class="btn-portal">
          Cổng Quản Lý Thông Tin
        </button>
      </div>
    </nav>

    <header id="home" class="hero-section">
      <div class="hero-bg"></div>
      <div class="hero-overlay"></div>

      <div class="hero-content">
        <div class="badge-hero">BIỂU TƯỢNG MỚI CỦA THÀNH PHỐ</div>
        <h1 class="main-title">
          Sống Đẳng Cấp<br /><span class="text-gold">Vị Thế Tiên Phong</span>
        </h1>
        <p class="desc">
          Sở hữu căn hộ hàng hiệu ngay tại trung tâm Quận 1 với tầm nhìn triệu
          đô hướng sông Sài Gòn.
        </p>

        <div class="hero-btns">
          <button @click="navigateToAI" class="btn-ai-hero">
            ✨ AI Tìm Căn Hộ
          </button>

          <button @click="scrollTo('products')" class="btn-primary-lg">
            Xem Bảng Giá
          </button>
        </div>
      </div>

      <div class="hero-search-box">
        <div class="search-item">
          <label>Vị trí</label>
          <span>Quận 1, TP.HCM</span>
        </div>
        <div class="divider"></div>
        <div class="search-item">
          <label>Công cụ</label>
          <span>AI Phân Tích & Gợi Ý</span>
        </div>
        <div class="divider"></div>
        <div class="search-item">
          <label>Tài chính</label>
          <span>Tối ưu theo ngân sách</span>
        </div>
        <button class="btn-search-hero" @click="navigateToAI">
          ✨ TÌM NGAY VỚI AI
        </button>
      </div>
    </header>

    <section id="about" class="section-padding bg-white">
      <div class="container">
        <div class="about-wrapper">
          <div class="about-image-col">
            <div class="img-frame">
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1000"
                alt="Building"
              />
              <div class="border-deco"></div>
            </div>
            <div class="experience-card">
              <span class="exp-number">10+</span>
              <span class="exp-text">Năm Kiến Tạo<br />Biểu Tượng</span>
            </div>
          </div>

          <div class="about-text-col">
            <div class="heading-group">
              <h4 class="sub-title-gold">― TỔNG QUAN DỰ ÁN</h4>
              <h2 class="main-heading">
                Kiệt Tác Kiến Trúc<br />Bên Dòng Sông Di Sản
              </h2>
            </div>

            <p class="desc-text">
              Grand Marina Saigon không chỉ là một dự án bất động sản, đó là
              tuyên ngôn về phong cách sống thượng lưu. Tọa lạc tại vị trí "Kim
              Cương" độc tôn, dự án sở hữu tầm nhìn triệu đô ôm trọn dòng sông
              Sài Gòn lịch sử.
            </p>

            <div class="stats-row">
              <div class="stat-item">
                <strong>60%</strong><span>Mảng xanh</span>
              </div>
              <div class="stat-item">
                <strong>1200</strong><span>Căn hộ</span>
              </div>
              <div class="stat-item">
                <strong>360°</strong><span>View sông</span>
              </div>
            </div>

            <ul class="luxury-list">
              <li>
                <span class="check-icon">⚜️</span>
                <div>
                  <strong>Vị trí độc tôn</strong>
                  <p>Tâm điểm kết nối, 5 phút đến Nhà Hát Thành Phố.</p>
                </div>
              </li>
              <li>
                <span class="check-icon">⚜️</span>
                <div>
                  <strong>Đặc quyền thượng lưu</strong>
                  <p>Bến du thuyền riêng, sảnh đón 5 sao, hồ bơi vô cực.</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section id="products" class="section-padding bg-light">
      <div class="container">
        <div class="section-header text-center">
          <h4 class="section-subtitle">SẢN PHẨM ĐỘC BẢN</h4>
          <h2 class="section-heading">Bộ Sưu Tập Căn Hộ</h2>
          <div class="divider-center"></div>
        </div>

        <div class="apartment-grid">
          <div v-for="apt in apartments" :key="apt.id" class="apt-card">
            <div class="card-img">
              <img
                :src="
                  apt.image && apt.image.startsWith('http')
                    ? apt.image
                    : `https://source.unsplash.com/random/400x300/?luxury-apartment,living-room,${apt.id}`
                "
                alt="Apartment"
                @error="
                  $event.target.src =
                    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=400'
                "
              />
              <div class="status-tag" :class="apt.status">
                {{ formatStatus(apt.status) }}
              </div>
              <div class="price-tag">{{ formatMoney(apt.price) }}</div>
            </div>

            <div class="card-body">
              <h3 class="apt-code">Căn hộ {{ apt.apartment_code }}</h3>
              <p class="apt-floor">Tầng {{ apt.floor }} • View Thành Phố</p>
              <div class="specs-row">
                <span>📐 {{ apt.area }}m²</span>
                <span>🛏️ 2 PN</span>
                <span>🛁 2 WC</span>
              </div>
              <div class="card-footer">
                <button
                  v-if="apt.status === 'con_trong'"
                  @click="
                    guestForm.message = `Tôi quan tâm căn ${apt.apartment_code}`;
                    scrollTo('contact');
                  "
                  class="btn-card"
                >
                  Đăng Ký Xem
                </button>
                <button v-else class="btn-card disabled" disabled>
                  Đã Có Chủ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section id="contact" class="contact-section">
      <div class="container">
        <div class="contact-wrapper">
          <div class="contact-info">
            <h4 class="section-subtitle text-gold">LIÊN HỆ VỚI CHÚNG TÔI</h4>
            <h2 class="info-title">Bạn Cần Tư Vấn?</h2>
            <p class="info-desc">
              Để lại thông tin, chuyên viên cao cấp sẽ liên hệ hỗ trợ bạn chọn
              căn hộ ưng ý nhất trong vòng 5 phút.
            </p>

            <div class="info-list">
              <div class="info-item">
                <div class="icon-circle">📞</div>
                <div>
                  <strong>Hotline/Support Email 24/7</strong>
                  <p>0123.456.789</p>
                  <p>example_mail@gmail.com</p>
                </div>
              </div>
              <div class="info-item">
                <div class="icon-circle">📍</div>
                <div>
                  <strong>Văn phòng dự án</strong>
                  <p>Số 2, Tôn Đức Thắng, Quận 1</p>
                </div>
              </div>
            </div>
          </div>

          <div class="contact-form-box">
            <h3>Đăng Ký Tư Vấn</h3>
            <p class="form-sub">Vui lòng điền thông tin bên dưới</p>
            <form @submit.prevent="submitForm">
              <div class="form-group">
                <input
                  v-model="guestForm.full_name"
                  placeholder="Họ và tên quý khách *"
                  required
                />
              </div>
              <div class="form-group">
                <input
                  v-model="guestForm.phone"
                  placeholder="Số điện thoại *"
                  required
                />
              </div>
              <div class="form-group">
                <input
                  v-model="guestForm.email"
                  placeholder="Email (Không bắt buộc)"
                />
              </div>
              <div class="form-group">
                <textarea
                  v-model="guestForm.message"
                  rows="3"
                  placeholder="Nhu cầu của quý khách..."
                ></textarea>
              </div>
              <button type="submit" class="btn-submit" :disabled="isSubmitting">
                {{ isSubmitting ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>

    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div class="footer-col">
            <div class="brand-footer">
              <span style="color: #d4af37; font-size: 30px">⚜️</span> GRAND
              MARINA
            </div>
            <p>
              Khu căn hộ hàng hiệu Marriott lớn nhất thế giới, kiến tạo chuẩn
              mực sống thượng lưu mới tại Việt Nam.
            </p>
          </div>
          <div class="footer-col">
            <h4>Liên Kết Nhanh</h4>
            <ul>
              <li>
                <a href="#" @click.prevent="scrollTo('home')">Trang chủ</a>
              </li>
              <li>
                <a href="#" @click.prevent="scrollTo('products')">Căn hộ</a>
              </li>
              <li>
                <a href="#" @click.prevent="scrollTo('contact')">Liên hệ</a>
              </li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Theo Dõi</h4>
            <div class="social-icons">
              <span>FB</span><span>YT</span><span>IG</span>
            </div>
          </div>
        </div>
        <div class="copyright">
          <p>
            © 2026 Grand Marina Saigon. Developed by Admin System. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* --- CORE STYLES --- */
:root {
  --primary: #d4af37;
  --dark: #0f172a;
  --light: #f8fafc;
  --font-heading: 'Playfair Display', serif;
  --font-body: 'Inter', sans-serif;
}
.luxury-landing {
  font-family: 'Inter', sans-serif;
  color: #333;
  overflow-x: hidden;
  width: 100%;
}
h1,
h2,
h3,
h4 {
  font-family: 'Playfair Display', serif;
  margin: 0;
}
p {
  line-height: 1.6;
  color: #64748b;
  margin-bottom: 15px;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  position: relative;
}
.section-padding {
  padding: 100px 0;
}
.bg-light {
  background: #f8fafc;
}
.bg-white {
  background: #fff;
}
.text-center {
  text-align: center;
}
.text-gold {
  color: #d4af37;
}

/* --- NAVBAR --- */
.navbar {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 100;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.7) 0%,
    rgba(0, 0, 0, 0) 100%
  );
  padding: 20px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}
.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 24px;
  font-weight: 700;
  color: white;
  letter-spacing: 2px;
}
.nav-menu {
  display: flex;
  gap: 40px;
}
.nav-menu a {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: 0.3s;
}
.nav-menu a:hover {
  color: #d4af37;
}
.btn-portal {
  padding: 10px 25px;
  background: transparent;
  color: #d4af37;
  border: 1px solid #d4af37;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 1px;
}
.btn-portal:hover {
  background: #d4af37;
  color: #000;
}

/* --- HERO --- */
.hero-section {
  height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
}
.hero-bg {
  position: absolute;
  inset: 0;
  background: url('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=2000')
    center/cover no-repeat;
  z-index: -2;
  animation: zoomEffect 20s infinite alternate;
}
.hero-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle,
    rgba(0, 0, 0, 0.2) 0%,
    rgba(0, 0, 0, 0.6) 100%
  );
  z-index: -1;
}
.hero-content {
  max-width: 900px;
  padding: 20px;
  animation: fadeInUp 1s ease-out;
}
.badge-hero {
  display: inline-block;
  padding: 5px 15px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 30px;
  margin-bottom: 20px;
  font-size: 12px;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(5px);
}
.main-title {
  font-size: 72px;
  line-height: 1.1;
  margin-bottom: 25px;
  font-weight: 700;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}
.desc {
  color: rgba(255, 255, 255, 0.9);
  font-size: 20px;
  margin-bottom: 40px;
}

/* --- NÚT AI MỚI --- */
.btn-ai-hero {
  padding: 15px 35px;
  background: linear-gradient(45deg, #d4af37, #fcd34d); /* Gradient Vàng */
  color: #0f172a; /* Chữ tối */
  border: none;
  font-size: 14px;
  font-weight: 800; /* Đậm hơn */
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  margin-right: 15px;
  transition: 0.4s;
  box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4); /* Phát sáng nhẹ */
}
.btn-ai-hero:hover {
  background: linear-gradient(45deg, #fcd34d, #d4af37);
  transform: translateY(-3px) scale(1.05); /* Phóng to nhẹ */
  box-shadow: 0 6px 20px rgba(212, 175, 55, 0.6);
}

.btn-primary-lg {
  padding: 15px 40px;
  background: rgba(255, 255, 255, 0.1); /* Làm mờ đi để nổi bật nút AI */
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  margin-right: 15px;
  transition: 0.3s;
}
.btn-primary-lg:hover {
  background: white;
  color: #000;
  transform: translateY(-3px);
}
.btn-outline-lg {
  padding: 15px 40px;
  background: transparent;
  color: white;
  border: 1px solid white;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: 0.3s;
}
.btn-outline-lg:hover {
  background: white;
  color: #000;
  transform: translateY(-3px);
}

.hero-search-box {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 20px;
  width: 80%;
  max-width: 900px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}
.search-item {
  flex: 1;
  text-align: left;
  padding: 0 20px;
}
.search-item label {
  display: block;
  font-size: 12px;
  color: #64748b;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 5px;
}
.search-item span {
  font-size: 16px;
  color: #0f172a;
  font-weight: 600;
  font-family: 'Playfair Display', serif;
}
.divider {
  width: 1px;
  height: 40px;
  background: #e2e8f0;
}
.btn-search-hero {
  background: #0f172a;
  color: #d4af37;
  border: none;
  padding: 15px 40px;
  font-weight: 700;
  cursor: pointer;
  height: 100%;
  transition: 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.btn-search-hero:hover {
  background: #1e293b;
  color: #fcd34d;
}

/* --- ABOUT --- */
.about-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}
.about-image-col {
  position: relative;
  padding-left: 20px;
  padding-bottom: 20px;
}
.img-frame {
  position: relative;
  z-index: 2;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
.img-frame img {
  width: 100%;
  display: block;
  transition: transform 0.5s ease;
}
.about-image-col:hover img {
  transform: scale(1.05);
}
.border-deco {
  position: absolute;
  top: -20px;
  left: -20px;
  width: 100%;
  height: 100%;
  border: 2px solid #d4af37;
  z-index: 1;
  transition: 0.3s;
}
.about-image-col:hover .border-deco {
  top: -30px;
  left: -30px;
}
.experience-card {
  position: absolute;
  bottom: 40px;
  right: -40px;
  background: #fff;
  padding: 30px;
  box-shadow: -10px 10px 30px rgba(0, 0, 0, 0.1);
  z-index: 3;
  border-left: 4px solid #d4af37;
  text-align: center;
  min-width: 150px;
}
.exp-number {
  display: block;
  font-size: 48px;
  font-weight: 700;
  color: #d4af37;
  font-family: 'Playfair Display', serif;
  line-height: 1;
  margin-bottom: 5px;
}
.exp-text {
  font-size: 13px;
  text-transform: uppercase;
  color: #0f172a;
  font-weight: 600;
  letter-spacing: 1px;
}

.sub-title-gold {
  color: #d4af37;
  font-size: 14px;
  letter-spacing: 3px;
  font-weight: 700;
  margin-bottom: 15px;
}
.main-heading {
  font-size: 48px;
  line-height: 1.2;
  color: #0f172a;
  margin-bottom: 30px;
}
.stats-row {
  display: flex;
  gap: 40px;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 30px;
  margin-bottom: 30px;
}
.stat-item strong {
  display: block;
  font-size: 32px;
  color: #0f172a;
  font-family: 'Playfair Display', serif;
}
.luxury-list {
  list-style: none;
  padding: 0;
}
.luxury-list li {
  display: flex;
  gap: 20px;
  margin-bottom: 25px;
  align-items: flex-start;
}
.check-icon {
  font-size: 20px;
  color: #d4af37;
  margin-top: 2px;
}
.luxury-list strong {
  display: block;
  color: #0f172a;
  font-size: 18px;
  font-family: 'Playfair Display', serif;
  margin-bottom: 5px;
}

/* --- APARTMENTS --- */
.divider-center {
  width: 60px;
  height: 3px;
  background: #d4af37;
  margin: 20px auto 50px;
}
.apartment-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 40px;
}
.apt-card {
  background: white;
  border: 1px solid #f1f5f9;
  transition: 0.4s;
}
.apt-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
}
.card-img {
  height: 250px;
  overflow: hidden;
  position: relative;
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
.status-tag {
  position: absolute;
  top: 15px;
  left: 15px;
  background: rgba(15, 23, 42, 0.9);
  color: white;
  padding: 6px 12px;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 600;
}
.price-tag {
  position: absolute;
  bottom: 0;
  right: 0;
  background: #d4af37;
  color: white;
  padding: 10px 20px;
  font-weight: 700;
  font-size: 16px;
}
.card-body {
  padding: 25px;
}
.apt-code {
  font-size: 20px;
  margin-bottom: 5px;
}
.specs-row {
  display: flex;
  justify-content: space-between;
  border-top: 1px solid #f1f5f9;
  border-bottom: 1px solid #f1f5f9;
  padding: 15px 0;
  margin-bottom: 20px;
  font-size: 14px;
  color: #475569;
}
.btn-card {
  width: 100%;
  padding: 12px;
  border: 1px solid #0f172a;
  background: transparent;
  color: #0f172a;
  font-weight: 600;
  text-transform: uppercase;
  cursor: pointer;
  transition: 0.3s;
  font-size: 12px;
}
.btn-card:hover {
  background: #0f172a;
  color: white;
}
.btn-card.disabled {
  border-color: #cbd5e1;
  color: #cbd5e1;
  cursor: not-allowed;
}

/* --- CONTACT --- */
.contact-section {
  background: #0f172a;
  color: white;
  padding: 100px 0;
}
.contact-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}
.info-title {
  font-size: 48px;
  margin-bottom: 20px;
  color: white;
  line-height: 1.2;
}
.info-desc {
  color: #94a3b8;
  margin-bottom: 40px;
  font-size: 16px;
}
.info-list {
  display: flex;
  flex-direction: column;
  gap: 30px;
}
.info-item {
  display: flex;
  gap: 20px;
  align-items: center;
}
.icon-circle {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #d4af37;
}
.info-item strong {
  display: block;
  font-size: 14px;
  text-transform: uppercase;
  color: #d4af37;
  letter-spacing: 1px;
  margin-bottom: 5px;
}
.info-item p {
  margin: 0;
  color: white;
  font-size: 18px;
  font-family: 'Playfair Display', serif;
}
.contact-form-box {
  background: white;
  padding: 50px;
  border-radius: 4px;
  color: #333;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
}
.contact-form-box h3 {
  font-size: 30px;
  margin-bottom: 5px;
  color: #0f172a;
}
.form-sub {
  color: #64748b;
  margin-bottom: 30px;
  font-size: 14px;
}
.form-group input,
.form-group textarea {
  width: 100%;
  padding: 15px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  outline: none;
  transition: 0.3s;
  font-family: 'Inter', sans-serif;
  box-sizing: border-box;
  margin-bottom: 20px;
}
.form-group input:focus,
.form-group textarea:focus {
  border-color: #d4af37;
  background: white;
}
.btn-submit {
  width: 100%;
  padding: 18px;
  background: #d4af37;
  color: white;
  border: none;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  cursor: pointer;
  transition: 0.3s;
}
.btn-submit:hover {
  background: #b5952f;
}

/* --- FOOTER --- */
.footer {
  background: #020617;
  padding: 80px 0 30px;
  color: #94a3b8;
  font-size: 14px;
  border-top: 1px solid #1e293b;
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 60px;
}
.brand-footer {
  color: white;
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.footer-col h4 {
  color: white;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  text-transform: uppercase;
  margin-bottom: 25px;
  letter-spacing: 1px;
  font-weight: 700;
}
.footer-col ul {
  list-style: none;
  padding: 0;
}
.footer-col ul li {
  margin-bottom: 12px;
}
.footer-col a {
  color: #94a3b8;
  text-decoration: none;
  transition: 0.2s;
}
.footer-col a:hover {
  color: #d4af37;
  padding-left: 5px;
}
.social-icons {
  display: flex;
  gap: 10px;
}
.social-icons span {
  width: 40px;
  height: 40px;
  border: 1px solid #334155;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: 0.2s;
  font-size: 12px;
}
.social-icons span:hover {
  border-color: #d4af37;
  color: #d4af37;
  background: rgba(212, 175, 55, 0.1);
}
.copyright {
  border-top: 1px solid #1e293b;
  padding-top: 30px;
  text-align: center;
  font-size: 12px;
  color: #475569;
}

@keyframes zoomEffect {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.1);
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
@media (max-width: 992px) {
  .hero-search-box {
    display: none;
  }
  .main-title {
    font-size: 42px;
  }
  .about-wrapper,
  .contact-wrapper,
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 50px;
  }
}
</style>
