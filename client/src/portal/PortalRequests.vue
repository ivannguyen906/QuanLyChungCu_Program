<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const user = ref(JSON.parse(localStorage.getItem('user_info') || '{}'));
const requests = ref([]);
const showModal = ref(false);
const form = ref({ title: '', content: '' });

// --- FETCH DATA ---
const fetchRequests = async () => {
  if (!user.value.id) return;
  try {
    // Gọi API lấy danh sách yêu cầu của chính cư dân này
    // Lưu ý: Server cần có API này (xem ghi chú bên dưới)
    const res = await axios.get(
      `http://103.82.195.119:5000/api/my-requests/${user.value.id}`,
    );
    requests.value = res.data;
  } catch (e) {
    console.error('Lỗi tải yêu cầu', e);
  }
};

// --- SUBMIT ---
const handleSubmit = async () => {
  if (!form.value.title || !form.value.content)
    return alert('Vui lòng nhập đủ thông tin');

  try {
    await axios.post('http://103.82.195.119:5000/api/requests', {
      resident_id: user.value.id,
      apartment_id: user.value.apartment_id, // Gửi kèm ID căn hộ
      title: form.value.title,
      content: form.value.content,
    });
    alert('Đã gửi yêu cầu thành công!');
    showModal.value = false;
    form.value = { title: '', content: '' };
    fetchRequests();
  } catch (e) {
    alert('Lỗi gửi yêu cầu');
  }
};

// --- HELPERS ---
const statusMap = {
  pending: { text: 'Chờ xử lý', class: 'pending' },
  processing: { text: 'Đang xử lý', class: 'processing' },
  done: { text: 'Hoàn thành', class: 'done' },
  rejected: { text: 'Từ chối', class: 'rejected' },
};

const formatDate = (date) => new Date(date).toLocaleString('vi-VN');

onMounted(fetchRequests);
</script>

<template>
  <div class="portal-container">
    <div class="page-header">
      <div class="header-text">
        <h2>Yêu cầu & Hỏi đáp</h2>
        <p>Gửi phản ánh, kiến nghị tới Ban Quản Lý</p>
      </div>
      <button @click="showModal = true" class="btn-primary">
        + Gửi yêu cầu mới
      </button>
    </div>

    <div class="content-card">
      <table class="data-table">
        <thead>
          <tr>
            <th width="25%">Tiêu đề</th>
            <th width="35%">Nội dung</th>
            <th width="15%">Trạng thái</th>
            <th width="25%">Phản hồi của BQL</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="req in requests" :key="req.id">
            <td>
              <div class="req-title">{{ req.title }}</div>
              <small class="time">{{ formatDate(req.created_at) }}</small>
            </td>
            <td class="req-content">{{ req.content }}</td>
            <td>
              <span :class="['status-badge', req.status]">
                {{ statusMap[req.status]?.text || req.status }}
              </span>
            </td>
            <td>
              <div v-if="req.admin_response" class="admin-reply">
                💬 {{ req.admin_response }}
              </div>
              <span v-else class="waiting-text">---</span>
            </td>
          </tr>
          <tr v-if="requests.length === 0">
            <td colspan="4" class="empty-text">Bạn chưa gửi yêu cầu nào.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-box">
        <div class="modal-header">
          <h3>Soạn yêu cầu mới</h3>
          <button @click="showModal = false" class="close-btn">×</button>
        </div>
        <div class="form-body">
          <div class="form-group">
            <label>Tiêu đề</label>
            <input
              v-model="form.title"
              placeholder="VD: Báo hỏng đèn hành lang..."
              class="input-field"
            />
          </div>
          <div class="form-group">
            <label>Nội dung chi tiết</label>
            <textarea
              v-model="form.content"
              rows="4"
              placeholder="Mô tả chi tiết vấn đề..."
              class="input-field"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showModal = false" class="btn-outline">Hủy</button>
          <button @click="handleSubmit" class="btn-primary">Gửi ngay</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ANIMATION */
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}
.header-text h2 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 24px;
  color: var(--dark);
}
.header-text p {
  margin: 5px 0 0;
  color: var(--gray);
  font-size: 14px;
}

/* BUTTONS */
.btn-primary {
  background: linear-gradient(135deg, var(--primary) 0%, #b5952f 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  box-shadow: 0 4px 10px rgba(212, 175, 55, 0.2);
}
.btn-primary:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}

.btn-outline {
  background: white;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}
.btn-outline:hover {
  background: #f1f5f9;
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
  font-weight: 700;
  font-size: 14px;
}
.data-table td {
  padding: 15px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: top;
  color: #334155;
  font-size: 14px;
}
.data-table tr:hover td {
  background: #f8fafc;
}

.req-title {
  font-weight: 600;
  color: var(--dark);
  margin-bottom: 4px;
}
.time {
  font-size: 12px;
  color: #94a3b8;
}
.req-content {
  line-height: 1.5;
  color: #475569;
}

/* BADGES */
.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}
.status-badge.pending {
  background: #fef3c7;
  color: #d97706;
} /* Vàng cam */
.status-badge.processing {
  background: #dbeafe;
  color: #2563eb;
} /* Xanh dương */
.status-badge.done {
  background: #dcfce7;
  color: #16a34a;
} /* Xanh lá */
.status-badge.rejected {
  background: #fee2e2;
  color: #ef4444;
} /* Đỏ */

.admin-reply {
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 8px;
  border-left: 3px solid var(--primary);
  font-size: 13px;
  font-style: italic;
  color: #475569;
}
.waiting-text {
  color: #cbd5e1;
  font-style: italic;
}
.empty-text {
  text-align: center;
  padding: 40px;
  color: #94a3b8;
  font-style: italic;
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
  width: 500px;
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
  gap: 15px;
}
.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}
.input-field {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: var(--font-body);
  box-sizing: border-box;
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
</style>
