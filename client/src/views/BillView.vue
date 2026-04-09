<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
// Import Component Thông báo
import NotificationToast from '../components/NotificationToast.vue';

const router = useRouter();
const bills = ref([]);
const apartments = ref([]);
// --- STATE MODALS ---
const showCreateModal = ref(false);
const showBankModal = ref(false);
const showQRModal = ref(false);
const showDetailModal = ref(false);
const showApproveModal = ref(false); // Modal duyệt ảnh (MỚI)

// --- CURRENT ITEMS ---
const currentBillDetail = ref(null);
const currentBillQR = ref(null);
const currentBillApprove = ref(null); // Bill đang được duyệt (MỚI)

// Biến cho in ấn
const showPrintPreview = ref(false);
const printBillData = ref(null);

// Hàm format trạng thái căn hộ
const formatAptStatus = (status) => {
  const map = {
    con_trong: 'Trống',
    dat_coc: 'Đã cọc',
    cho_thue: 'Cho thuê',
  };
  return map[status] || 'Khác';
};

const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));
const paymentInfo = ref({
  bank_code: 'MB',
  bank_name: 'MB Bank',
  account_number: '',
  account_holder: '',
});
const banks = [
  { code: 'MB', name: 'MB Bank' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'TCB', name: 'Techcombank' },
];
const form = ref({
  apartment_id: '',
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  elec_old: 0, // Số điện cũ (lấy từ hóa đơn gần nhất)
  elec_new: 0, // Số điện mới nhập
  water_old: 0, // Số nước cũ
  water_new: 0, // Số nước mới nhập
  rent_amount: 0, // Tiền thuê nhà (lấy từ bảng apartments)
  service_fee: 0, // Phí dịch vụ
  total_amount: 0,
});

const onApartmentChange = async () => {
  // Tìm căn hộ được chọn trong danh sách apartments
  const selectedApt = apartments.value.find(
    (a) => a.id === form.value.apartment_id,
  );

  if (selectedApt) {
    console.log('Dữ liệu căn hộ đang chọn:', selectedApt);
    // ĐỔI .price THÀNH .rental_price
    form.value.rent_amount = Number(selectedApt.rental_price) || 0;

    // Tính Phí quản lý: Diện tích * 7.000đ
    form.value.service_fee = (Number(selectedApt.area) || 0) * 7000;

    try {
      const res = await axios.get(
        `http://103.82.195.119:5000/api/bills/latest/${form.value.apartment_id}`,
      );
      if (res.data) {
        form.value.elec_old = Number(res.data.elec_new) || 0;
        form.value.water_old = Number(res.data.water_new) || 0;
      }
    } catch (e) {
      form.value.elec_old = 0;
      form.value.water_old = 0;
    }

    handleCalculateTotal();
  }
};

// Định nghĩa đơn giá (Bạn có thể lấy từ .env hoặc DB)
const UNIT_PRICES = {
  electricity: 3500, // VNĐ/kWh
  water: 15000, // VNĐ/m3
};

const handleCalculateTotal = () => {
  const electricityUsed = Math.max(
    0,
    form.value.elec_new - form.value.elec_old,
  );
  const waterUsed = Math.max(0, form.value.water_new - form.value.water_old);

  const electricityCost = electricityUsed * UNIT_PRICES.electricity;
  const waterCost = waterUsed * UNIT_PRICES.water;

  form.value.total_amount =
    Number(form.value.rent_amount) +
    Number(form.value.service_fee) +
    electricityCost +
    waterCost;
};

// --- LOGIC FETCH DATA ---
const fetchBills = async () => {
  try {
    const res = await axios.get('http://103.82.195.119:5000/api/bills');
    // Sắp xếp: Pending (Chờ duyệt) lên đầu -> Unpaid -> Paid
    bills.value = res.data.sort((a, b) => {
      const order = { pending: 1, unpaid: 2, paid: 3 };
      return order[a.status] - order[b.status];
    });
  } catch (e) {}
};
const fetchApartments = async () => {
  try {
    const res = await axios.get('http://103.82.195.119:5000/api/apartments');
    apartments.value = res.data;
  } catch (e) {}
};
const fetchPaymentSettings = async () => {
  try {
    const res = await axios.get(
      'http://103.82.195.119:5000/api/payment-settings',
    );
    if (res.data.id) paymentInfo.value = res.data;
  } catch (e) {}
};

// --- LOGIC XỬ LÝ ---
const handleCreate = async () => {
  try {
    if (!form.value.apartment_id) return alert('Chọn căn hộ!');
    await axios.post('http://103.82.195.119:5000/api/bills', form.value);
    showCreateModal.value = false;
    fetchBills();
    alert('Lập hóa đơn thành công!');
  } catch (e) {
    alert('Lỗi: ' + e.response?.data?.message);
  }
};
const handleSaveBank = async () => {
  await axios.post(
    'http://103.82.195.119:5000/api/payment-settings',
    paymentInfo.value,
  );
  showBankModal.value = false;
  alert('Đã lưu!');
};
const handlePay = async (bill) => {
  if (bill.status !== 'paid' && confirm('Xác nhận thu tiền mặt trực tiếp?')) {
    await axios.put(`http://103.82.195.119:5000/api/bills/${bill.id}/pay`);
    fetchBills();
  }
};
const handleDelete = async (id) => {
  if (confirm('Xóa hóa đơn này?')) {
    await axios.delete(`http://103.82.195.119:5000/api/bills/${id}`);
    fetchBills();
  }
};

// --- LOGIC DUYỆT / TỪ CHỐI (MỚI) ---
const openApprove = (bill) => {
  currentBillApprove.value = bill;
  showApproveModal.value = true;
};

const approveBill = async () => {
  if (!confirm('Xác nhận tiền đã về tài khoản?')) return;
  try {
    await axios.put(
      `http://103.82.195.119:5000/api/bills/approve/${currentBillApprove.value.id}`,
    );
    alert('Đã duyệt thành công!');
    showApproveModal.value = false;
    fetchBills();
  } catch (e) {
    alert('Lỗi khi duyệt: ' + e.message);
  }
};

const rejectBill = async () => {
  if (!confirm('Từ chối biên lai này?')) return;
  try {
    await axios.put(
      `http://103.82.195.119:5000/api/bills/reject/${currentBillApprove.value.id}`,
    );
    alert('Đã từ chối!');
    showApproveModal.value = false;
    fetchBills();
  } catch (e) {
    alert('Lỗi khi từ chối: ' + e.message);
  }
};

const openQR = (bill) => {
  if (!paymentInfo.value.account_number) return alert('Cấu hình NH trước!');
  currentBillQR.value = bill;
  showQRModal.value = true;
};
const qrImageSrc = computed(() => {
  if (!currentBillQR.value) return '';
  const b = currentBillQR.value;
  const p = paymentInfo.value;
  const content = `${b.apartment_code} T${b.month} ${b.year}`;
  return `https://img.vietqr.io/image/${p.bank_code}-${p.account_number}-compact2.png?amount=${b.total_amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(p.account_holder)}`;
});

const openDetail = (bill) => {
  currentBillDetail.value = bill;
  currentBillDetail.value.parsedDetails =
    typeof bill.bill_details === 'string'
      ? JSON.parse(bill.bill_details)
      : bill.bill_details || [];
  showDetailModal.value = true;
};

// --- CHỨC NĂNG IN HÓA ĐƠN ---
const openPrint = (bill) => {
  printBillData.value = bill;
  printBillData.value.parsedDetails =
    typeof bill.bill_details === 'string'
      ? JSON.parse(bill.bill_details)
      : bill.bill_details || [];
  showPrintPreview.value = true;
  setTimeout(() => {
    window.print();
  }, 500);
};

const formatMoney = (v) => Number(v).toLocaleString('vi-VN') + ' đ';
const logout = () => {
  localStorage.removeItem('user_info');
  router.push('/login');
};
onMounted(() => {
  if (!user.value.username) router.push('/login');
  fetchBills();
  fetchApartments();
  fetchPaymentSettings();
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
        <router-link to="/apartments" class="nav-item">🏢 Căn hộ</router-link>
        <router-link v-if="user.role === 'admin'" to="/staff" class="nav-item"
          >🛡️ Nhân sự</router-link
        >
        <router-link to="/residents" class="nav-item">👥 Cư dân</router-link>
        <router-link to="/leads" class="nav-item">📞 Khách hàng</router-link>
        <router-link to="/bills" class="nav-item active"
          >📄 Hóa đơn</router-link
        >
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

    <main class="main-content no-print">
      <header class="header">
        <div>
          <h1>Quản lý Hóa đơn</h1>
          <p>Danh sách thanh toán phí dịch vụ hàng tháng</p>
        </div>

        <div class="header-actions">
          <NotificationToast role="user" :userId="user.id" />

          <button @click="showBankModal = true" class="btn-secondary">
            ⚙️ Ngân hàng
          </button>
          <button @click="showCreateModal = true" class="btn-primary">
            + Lập hóa đơn
          </button>
        </div>
      </header>

      <div class="content-card">
        <table class="data-table">
          <thead>
            <tr>
              <th>Căn hộ</th>
              <th>Kỳ hóa đơn</th>
              <th>Tổng tiền</th>
              <th>Thanh toán</th>
              <th style="text-align: right">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in bills" :key="b.id">
              <td class="code">
                {{ b.apartment_code }}
                <div
                  style="
                    font-size: 11px;
                    color: #64748b;
                    font-weight: normal;
                    margin-top: 2px;
                  "
                >
                  ({{
                    formatAptStatus(
                      apartments.find((a) => a.id === b.apartment_id)?.status,
                    )
                  }})
                </div>
              </td>

              <td>Tháng {{ b.month }}/{{ b.year }}</td>
              <td class="money">
                {{ formatMoney(b.total_amount) }}
                <span
                  class="info-icon"
                  @click="openDetail(b)"
                  title="Xem chi tiết"
                  >ℹ️</span
                >
              </td>
              <td>
                <span v-if="b.status === 'paid'" class="status-badge paid"
                  >Đã thanh toán</span
                >

                <div v-else-if="b.status === 'unpaid'" class="pay-actions">
                  <button class="btn-qr" @click="openQR(b)">💳 QR</button>
                  <span class="status-badge unpaid" @click="handlePay(b)"
                    >Chưa thu</span
                  >
                </div>

                <button
                  v-else-if="b.status === 'pending'"
                  @click="openApprove(b)"
                  class="btn-pending"
                >
                  ⏳ Chờ duyệt
                </button>
              </td>
              <td style="text-align: right">
                <div class="action-group">
                  <button
                    @click="openPrint(b)"
                    class="btn-icon print"
                    title="In"
                  >
                    🖨️
                  </button>
                  <button
                    v-if="user.role === 'admin'"
                    @click="handleDelete(b.id)"
                    class="btn-icon delete"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>

    <div v-if="showCreateModal" class="modal-overlay no-print">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Lập Hóa Đơn Mới</h3>
          <button @click="showCreateModal = false" class="close-btn">×</button>
        </div>
        <div class="form-body">
          <div class="form-row">
            <div class="half">
              <label>Tháng</label>
              <input type="number" v-model="form.month" class="input-field" />
            </div>
            <div class="half">
              <label>Năm</label>
              <input type="number" v-model="form.year" class="input-field" />
            </div>
          </div>

          <div class="form-group">
            <label>Căn hộ</label>
            <select
              v-model="form.apartment_id"
              class="input-field"
              @change="onApartmentChange"
            >
              <option value="">-- Chọn căn hộ --</option>
              <option v-for="a in apartments" :key="a.id" :value="a.id">
                {{ a.apartment_code }} ({{ formatAptStatus(a.status) }})
              </option>
            </select>
          </div>

          <div class="form-row">
            <div class="half">
              <label>Số điện mới (kWh)</label>
              <input
                type="number"
                v-model="form.elec_new"
                class="input-field"
                @input="handleCalculateTotal"
              />
            </div>
            <div class="half">
              <label>Số nước mới (m³)</label>
              <input
                type="number"
                v-model="form.water_new"
                class="input-field"
                @input="handleCalculateTotal"
              />
            </div>
          </div>

          <div
            class="form-group"
            style="
              margin-top: 10px;
              padding: 10px;
              background: #fffbeb;
              border-radius: 8px;
              border: 1px solid #fde68a;
            "
          >
            <p style="margin: 0; color: #92400e; font-weight: bold">
              Dự kiến tổng:
              {{ form.total_amount ? formatMoney(form.total_amount) : '0 đ' }}
            </p>
            <small style="font-size: 10px; color: #b45309">
              (Bao gồm: Thuê {{ formatMoney(form.rent_amount || 0) }} + Phí Quản
              lý {{ formatMoney(form.service_fee || 0) }})
            </small>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showCreateModal = false" class="btn-outline">
            Hủy
          </button>
          <button @click="handleCreate" class="btn-primary">Tính & Lưu</button>
        </div>
      </div>
    </div>

    <div
      v-if="showDetailModal"
      class="modal-overlay no-print"
      @click.self="showDetailModal = false"
    >
      <div class="modal-box">
        <div class="modal-header">
          <h3>Chi tiết Hóa đơn {{ currentBillDetail?.apartment_code }}</h3>
          <button @click="showDetailModal = false" class="close-btn">×</button>
        </div>
        <div class="detail-list">
          <div
            v-for="(item, index) in currentBillDetail?.parsedDetails"
            :key="index"
            class="detail-item"
          >
            <span>{{ item.name }}</span
            ><strong>{{ formatMoney(item.amount) }}</strong>
          </div>
          <div class="detail-item total">
            <span>TỔNG CỘNG</span
            ><strong>{{ formatMoney(currentBillDetail?.total_amount) }}</strong>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showDetailModal = false" class="btn-primary">
            Đóng
          </button>
        </div>
      </div>
    </div>

    <div v-if="showBankModal" class="modal-overlay no-print">
      <div class="modal-box">
        <div class="modal-header"><h3>Cấu hình Ngân hàng</h3></div>
        <div class="form-body">
          <div class="form-group">
            <label>Ngân hàng</label>
            <select v-model="paymentInfo.bank_code" class="input-field">
              <option v-for="k in banks" :value="k.code">{{ k.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Số TK</label>
            <input v-model="paymentInfo.account_number" class="input-field" />
          </div>
          <div class="form-group">
            <label>Chủ TK</label>
            <input v-model="paymentInfo.account_holder" class="input-field" />
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showBankModal = false" class="btn-outline">
            Hủy
          </button>
          <button @click="handleSaveBank" class="btn-primary">Lưu</button>
        </div>
      </div>
    </div>

    <div
      v-if="showQRModal"
      class="modal-overlay no-print"
      @click.self="showQRModal = false"
    >
      <div class="modal-box qr-box">
        <div class="modal-header"><h3>Quét mã thanh toán</h3></div>
        <div style="padding: 20px; text-align: center">
          <img :src="qrImageSrc" class="qr-img" />
          <p style="font-size: 20px; color: var(--primary); margin-top: 10px">
            {{ formatMoney(currentBillQR?.total_amount) }}
          </p>
        </div>
        <div class="modal-footer">
          <button @click="showQRModal = false" class="btn-primary">Đóng</button>
        </div>
      </div>
    </div>

    <div
      v-if="showApproveModal"
      class="modal-overlay no-print"
      @click.self="showApproveModal = false"
    >
      <div class="modal-box">
        <div class="modal-header">
          <h3>
            Xác nhận thanh toán - {{ currentBillApprove?.apartment_code }}
          </h3>
          <button @click="showApproveModal = false" class="close-btn">×</button>
        </div>

        <div class="modal-body">
          <div class="proof-container">
            <img
              v-if="currentBillApprove?.payment_image"
              :src="`http://103.82.195.119:5000/uploads/${currentBillApprove?.payment_image}`"
              alt="Biên lai chuyển khoản"
            />
            <p v-else style="padding: 20px; text-align: center; color: #94a3b8">
              Không tải được ảnh biên lai.
            </p>
          </div>
          <div style="margin-top: 15px; text-align: center">
            <p style="color: #64748b">
              Số tiền cần thu:
              <strong style="color: #d4af37; font-size: 16px">{{
                formatMoney(currentBillApprove?.total_amount)
              }}</strong>
            </p>
          </div>
        </div>

        <div class="modal-footer">
          <button
            @click="rejectBill"
            class="btn-outline"
            style="border-color: #ef4444; color: #ef4444"
          >
            Từ chối
          </button>
          <button
            @click="approveBill"
            class="btn-primary"
            style="background: #16a34a"
          >
            ✔ Xác nhận tiền về
          </button>
        </div>
      </div>
    </div>

    <div v-if="showPrintPreview" class="print-area" id="print-area">
      <div class="bill-paper">
        <div class="bill-header">
          <h2>HÓA ĐƠN TIỀN DỊCH VỤ</h2>
          <p>Tháng {{ printBillData.month }} Năm {{ printBillData.year }}</p>
          <div class="bill-meta">
            <span
              >Mã căn: <strong>{{ printBillData.apartment_code }}</strong></span
            >
            <span>Ngày in: {{ new Date().toLocaleDateString('vi-VN') }}</span>
          </div>
        </div>
        <hr />
        <div class="bill-customer">
          <p>
            <strong>Chủ hộ:</strong>
            {{ printBillData.owner_name || '....................' }}
          </p>
          <p>
            <strong>Trạng thái:</strong>
            {{
              printBillData.status === 'paid'
                ? 'Đã thanh toán'
                : 'Chưa thanh toán'
            }}
          </p>
        </div>
        <table class="bill-table">
          <thead>
            <tr>
              <th>Khoản phí</th>
              <th class="text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in printBillData.parsedDetails" :key="idx">
              <td>{{ item.name }}</td>
              <td class="text-right">{{ formatMoney(item.amount) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td><strong>TỔNG CỘNG</strong></td>
              <td class="text-right">
                <strong>{{ formatMoney(printBillData.total_amount) }}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
        <div class="bill-footer">
          <p>
            Vui lòng thanh toán trước ngày 10 hàng tháng. Cảm ơn quý cư dân!
          </p>
          <div class="sign-area">
            <div><strong>Người lập</strong><br /><br /><br />(Ký tên)</div>
            <div><strong>Ban quản lý</strong><br /><br /><br />(Đóng dấu)</div>
          </div>
        </div>
      </div>
      <button class="close-print no-print" @click="showPrintPreview = false">
        ❌ Đóng
      </button>
    </div>
  </div>
</template>

<style scoped>
/* --- 1. LAYOUT CHUNG & SIDEBAR (LUXURY STYLE) --- */
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

/* --- 2. MAIN CONTENT --- */
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
  gap: 10px;
  align-items: center;
}

.btn-primary {
  background: linear-gradient(180deg, var(--primary) 0%, #b5952f 100%);
  color: var(--white);
  border: none;
  padding: 10px 25px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.btn-secondary {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}

/* --- 3. DATA TABLE (LUXURY STYLE) --- */
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
.money {
  font-weight: 700;
  color: #0f172a;
  font-size: 15px;
}

/* BADGES */
.status-badge {
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
}
.status-badge.paid {
  background: #dcfce7;
  color: #16a34a;
  cursor: default;
}
.status-badge.unpaid {
  background: #fee2e2;
  color: #ef4444;
}

/* NÚT PENDING - CHỜ DUYỆT */
.btn-pending {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 6px 15px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(217, 119, 6, 0.3);
  animation: pulse 2s infinite;
}
.btn-pending:hover {
  transform: translateY(-1px);
}

.pay-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.btn-qr {
  background: #2563eb;
  color: white;
  border: none;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  font-weight: 600;
}

/* ACTIONS */
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
}
.btn-icon.print {
  background: #fff7ed;
  color: #ea580c;
}
.btn-icon.delete {
  background: #fef2f2;
  color: #ef4444;
}

.info-icon {
  margin-left: 5px;
  color: #64748b;
  cursor: pointer;
}

/* --- 4. MODAL FIX --- */
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
  gap: 20px;
}
.form-row {
  display: flex;
  gap: 20px;
}
.half {
  flex: 1;
}

.form-group label,
.half label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 8px;
}
.input-field {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: var(--font-body);
  box-sizing: border-box;
  transition: 0.2s;
}
.input-field:focus {
  border-color: var(--primary);
  outline: none;
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

/* KHUNG ẢNH TRONG MODAL */
.proof-container {
  background: #000;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
  background: #f1f5f9;
  min-height: 200px;
  align-items: center;
}
.proof-container img {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

/* Các phần khác giữ nguyên */
.detail-list {
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px;
}
.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}
.detail-item.total {
  border-top: 1px dashed #cbd5e1;
  padding-top: 10px;
  font-size: 16px;
  color: var(--primary);
}
.qr-img {
  width: 100%;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(245, 158, 11, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
}

/* PRINT STYLE */
@media print {
  .sidebar,
  .main-content > header,
  .no-print {
    display: none !important;
  }
  .print-area {
    position: static;
    background: white;
    display: block;
  }
  .bill-paper {
    box-shadow: none;
    padding: 0;
    width: 100%;
  }
  .close-print {
    display: none;
  }
  body {
    background: white;
  }
  .app-layout {
    height: auto;
    display: block;
  }
}

.print-area {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bill-paper {
  background: white;
  width: 210mm;
  min-height: 148mm;
  padding: 20mm;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  font-family: 'Times New Roman', serif;
}
.bill-header {
  text-align: center;
  margin-bottom: 20px;
}
.bill-header h2 {
  font-size: 24px;
  text-transform: uppercase;
  margin: 0;
}
.bill-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 15px;
  font-style: italic;
}
.bill-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}
.bill-table th,
.bill-table td {
  border: 1px solid #000;
  padding: 8px;
}
.text-right {
  text-align: right;
}
.bill-footer {
  margin-top: 30px;
  text-align: center;
}
.sign-area {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  padding: 0 30px;
}
.close-print {
  position: absolute;
  top: 20px;
  right: 20px;
  background: #ef4444;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}
</style>
