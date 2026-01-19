<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';

const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));
const bills = ref([]);
const paymentInfo = ref({});
const showDetailModal = ref(false);
const showQRModal = ref(false);
const selectedBill = ref(null);
const fileInput = ref(null);
const isUploading = ref(false);

// --- FETCH DATA ---
const fetchData = async () => {
  if (!user.value.apartment_id) return;
  try {
    const resBills = await axios.get(
      `http://localhost:3000/api/my-bills/${user.value.apartment_id}`,
    );
    bills.value = resBills.data;
    const resBank = await axios.get(
      'http://localhost:3000/api/payment-settings',
    );
    paymentInfo.value = resBank.data;
  } catch (e) {
    console.error(e);
  }
};

const formatMoney = (n) => Number(n).toLocaleString('vi-VN') + ' đ';

// --- ACTIONS ---
const openDetail = (bill) => {
  selectedBill.value = bill;
  selectedBill.value.parsedDetails =
    typeof bill.bill_details === 'string'
      ? JSON.parse(bill.bill_details)
      : bill.bill_details || [];
  showDetailModal.value = true;
};

const openQR = (bill) => {
  if (!paymentInfo.value.account_number)
    return alert('BQL chưa cấu hình ngân hàng!');
  selectedBill.value = bill;
  showQRModal.value = true;
};

// --- LOGIC UPLOAD ẢNH ---
const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (!confirm('Xác nhận gửi biên lai này cho BQL kiểm tra?')) return;

  isUploading.value = true;
  const formData = new FormData();
  formData.append('image', file);
  formData.append('bill_id', selectedBill.value.id);

  try {
    await axios.post('http://localhost:3000/api/bills/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    alert('Đã gửi biên lai! Vui lòng chờ BQL xác nhận.');
    showQRModal.value = false;
    fetchData(); // Load lại danh sách để cập nhật trạng thái
  } catch (e) {
    alert('Lỗi upload ảnh: ' + e.message);
  } finally {
    isUploading.value = false;
  }
};

const qrImageSrc = computed(() => {
  if (!selectedBill.value || !paymentInfo.value.bank_code) return '';
  const b = selectedBill.value;
  const p = paymentInfo.value;
  const content = `${user.value.apartment_code} T${b.month} ${b.year}`;
  return `https://img.vietqr.io/image/${p.bank_code}-${p.account_number}-compact2.png?amount=${b.total_amount}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(p.account_holder)}`;
});

const getStatusBadge = (status) => {
  if (status === 'paid') return { text: 'Đã thanh toán', class: 'paid' };
  if (status === 'pending') return { text: 'Chờ duyệt', class: 'pending' };
  return { text: 'Chưa thanh toán', class: 'unpaid' };
};

onMounted(fetchData);
</script>

<template>
  <div class="portal-container">
    <div class="page-header">
      <h2>Hóa đơn & Thanh toán</h2>
      <p>Danh sách các khoản phí dịch vụ cần thanh toán</p>
    </div>

    <div class="content-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Kỳ hóa đơn</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Chi tiết</th>
            <th style="text-align: right">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bill in bills" :key="bill.id">
            <td>
              <strong>Tháng {{ bill.month }}/{{ bill.year }}</strong>
            </td>
            <td class="money">{{ formatMoney(bill.total_amount) }}</td>
            <td>
              <span
                :class="['status-badge', getStatusBadge(bill.status).class]"
              >
                {{ getStatusBadge(bill.status).text }}
              </span>
            </td>
            <td>
              <button @click="openDetail(bill)" class="btn-text">
                Xem chi tiết ℹ️
              </button>
            </td>
            <td style="text-align: right">
              <button
                v-if="bill.status === 'unpaid'"
                @click="openQR(bill)"
                class="btn-qr"
              >
                💳 Thanh toán ngay
              </button>
              <span v-else-if="bill.status === 'pending'" class="text-pending">
                ⏳ Đang chờ duyệt...
              </span>
              <span v-else class="text-success"> ✔ Hoàn tất </span>
            </td>
          </tr>
          <tr v-if="bills.length === 0">
            <td colspan="5" class="empty-text">Bạn chưa có hóa đơn nào.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div
      v-if="showDetailModal"
      class="modal-overlay"
      @click.self="showDetailModal = false"
    >
      <div class="modal-box">
        <div class="modal-header">
          <h3>
            Chi tiết phí T{{ selectedBill?.month }}/{{ selectedBill?.year }}
          </h3>
          <button @click="showDetailModal = false" class="close-btn">×</button>
        </div>
        <div class="detail-list">
          <div
            v-for="(item, idx) in selectedBill?.parsedDetails"
            :key="idx"
            class="detail-item"
          >
            <span>{{ item.name }}</span>
            <strong>{{ formatMoney(item.amount) }}</strong>
          </div>
          <div class="detail-item total">
            <span>TỔNG CỘNG</span>
            <strong>{{ formatMoney(selectedBill?.total_amount) }}</strong>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showDetailModal = false" class="btn-primary">
            Đóng
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="showQRModal"
      class="modal-overlay"
      @click.self="showQRModal = false"
    >
      <div class="modal-box qr-box">
        <div class="modal-header">
          <h3>Thanh toán chuyển khoản</h3>
          <button @click="showQRModal = false" class="close-btn">×</button>
        </div>

        <div class="qr-body">
          <div class="qr-step">
            <span class="step-num">1</span>
            <p>Quét mã QR để chuyển khoản</p>
          </div>
          <img :src="qrImageSrc" class="qr-img" />
          <p class="qr-amount">{{ formatMoney(selectedBill?.total_amount) }}</p>

          <div class="divider"></div>

          <div class="qr-step">
            <span class="step-num">2</span>
            <p>Upload ảnh biên lai (Sau khi chuyển khoản)</p>
          </div>

          <input
            type="file"
            ref="fileInput"
            @change="handleFileUpload"
            accept="image/*"
            style="display: none"
          />
          <button
            @click="triggerFileInput"
            class="btn-upload"
            :disabled="isUploading"
          >
            {{
              isUploading ? 'Đang gửi ảnh...' : '📸 Tải lên biên lai xác nhận'
            }}
          </button>
          <p class="note-upload">BQL sẽ duyệt trong vòng 24h làm việc.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* GENERAL ANIMATION */
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

/* TABLE STYLE */
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
  font-weight: 700;
  font-size: 14px;
}
.data-table td {
  padding: 15px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  color: #334155;
  font-size: 14px;
}
.data-table tr:hover td {
  background: #f8fafc;
}

.money {
  color: var(--primary);
  font-weight: 700;
}
.btn-text {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  text-decoration: underline;
  font-size: 13px;
}
.btn-text:hover {
  color: var(--primary);
}

/* STATUS BADGES */
.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}
.status-badge.paid {
  background: #dcfce7;
  color: #16a34a;
}
.status-badge.unpaid {
  background: #fee2e2;
  color: #ef4444;
}
.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
} /* Màu vàng cam cho pending */

/* ACTION BUTTONS */
.btn-qr {
  background: linear-gradient(135deg, var(--primary) 0%, #b5952f 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  font-size: 13px;
}
.btn-qr:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.text-success {
  color: #16a34a;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}
.text-pending {
  color: #d97706;
  font-weight: 600;
  font-style: italic;
}

/* MODAL STYLES */
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
  padding: 15px 25px;
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

/* QR BODY & UPLOAD */
.qr-body {
  padding: 25px;
  text-align: center;
}
.qr-step {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  justify-content: center;
}
.step-num {
  width: 24px;
  height: 24px;
  background: var(--dark);
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qr-step p {
  margin: 0;
  font-weight: 600;
  color: var(--dark);
  font-size: 14px;
}

.qr-img {
  width: 100%;
  max-width: 250px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-bottom: 5px;
}
.qr-amount {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
  margin: 0 0 15px;
}

.divider {
  height: 1px;
  background: #e2e8f0;
  margin: 15px 0;
}

.btn-upload {
  width: 100%;
  padding: 12px;
  background: white;
  border: 2px dashed #94a3b8;
  color: #64748b;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-upload:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: #fffcf0;
}
.note-upload {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 10px;
  font-style: italic;
}

.detail-list {
  padding: 20px 25px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #334155;
}
.detail-item.total {
  border-top: 1px dashed #cbd5e1;
  padding-top: 12px;
  margin-top: 5px;
  font-size: 16px;
  color: var(--primary);
  font-weight: 700;
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
</style>
