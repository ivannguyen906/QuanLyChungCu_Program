import { createRouter, createWebHistory } from 'vue-router';

// 1. IMPORT CÁC VIEWS (PUBLIC & ADMIN)
import LandingPage from '../views/LandingPage.vue';
import LoginView from '../views/LoginView.vue';
import DashboardView from '../views/DashboardView.vue';
import ApartmentView from '../views/ApartmentView.vue';
import StaffView from '../views/StaffView.vue';
import ResidentView from '../views/ResidentView.vue';
import LeadView from '../views/LeadView.vue';
import BillView from '../views/BillView.vue';
import ServiceView from '../views/ServiceView.vue';
import RequestView from '../views/RequestView.vue';
import ChatView from '../views/ChatView.vue';
import AnnouncementView from '../views/AnnouncementView.vue';
import GuestSmartSearch from '../views/GuestSmartSearch.vue'; // Trang AI

// 2. IMPORT PORTAL COMPONENTS
import ResidentPortal from '../portal/ResidentPortal.vue'; // Layout khung (Sidebar + Header)
import PortalDashboard from '../portal/PortalDashboard.vue'; // Nội dung Dashboard
import PortalBills from '../portal/PortalBills.vue';
import PortalRequests from '../portal/PortalRequests.vue';
import PortalInfo from '../portal/PortalInfo.vue';
import PortalServices from '../portal/PortalServices.vue';
import PortalAnnouncements from '../portal/PortalAnnouncements.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // --- PUBLIC ROUTES ---
    {
      path: '/',
      name: 'home',
      component: LandingPage,
    },
    {
      path: '/smart-search',
      name: 'smart-search',
      component: GuestSmartSearch,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },

    // --- CƯ DÂN ROUTES (CẤU TRÚC LỒNG NHAU) ---
    {
      path: '/portal',
      component: ResidentPortal, // Layout chính
      meta: { requiresAuth: true, role: 'resident' },
      children: [
        {
          path: '', // Mặc định vào /portal sẽ hiện Dashboard
          name: 'portal-home',
          component: PortalDashboard,
        },
        {
          path: 'bills', // Đường dẫn: /portal/bills
          name: 'portal-bills',
          component: PortalBills, // Tạm thời dùng Dashboard (Thay bằng PortalBills.vue sau)
        },
        {
          path: 'requests', // Đường dẫn: /portal/requests
          name: 'portal-requests',
          component: PortalRequests, // Tạm thời dùng Dashboard (Thay bằng PortalRequests.vue sau)
        },
        {
          path: 'info', // Đường dẫn: /portal/info
          name: 'portal-info',
          component: PortalInfo,
        },
        {
          path: 'services', // Đường dẫn: /portal/services
          name: 'portal-services',
          component: PortalServices,
        },
        {
          path: 'announcements', // Đường dẫn: /portal/announcements
          name: 'portal-announcements',
          component: PortalAnnouncements,
        },
      ],
    },

    // --- ADMIN / MANAGER ROUTES ---
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true, role: 'admin_manager' },
    },
    {
      path: '/apartments',
      name: 'apartments',
      component: ApartmentView,
      meta: { requiresAuth: true, role: 'admin_manager' },
    },
    {
      path: '/residents',
      name: 'residents',
      component: ResidentView,
      meta: { requiresAuth: true, role: 'admin_manager' },
    },
    {
      path: '/staff',
      name: 'staff',
      component: StaffView,
      meta: { requiresAuth: true, role: 'admin_only' }, // Chỉ Admin (Super) mới vào được
    },
    {
      path: '/leads',
      name: 'leads',
      component: LeadView,
      meta: { requiresAuth: true, role: 'admin_manager' },
    },
    {
      path: '/bills',
      name: 'bills',
      component: BillView,
      meta: { requiresAuth: true, role: 'admin_manager' },
    },
    {
      path: '/services',
      name: 'services',
      component: ServiceView,
      meta: { requiresAuth: true, role: 'admin_manager' },
    },
    {
      path: '/requests',
      name: 'requests',
      component: RequestView,
      meta: { requiresAuth: true, role: 'admin_manager' },
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView,
      meta: { requiresAuth: true, role: 'admin_manager' },
    },
    {
      path: '/announcements',
      name: 'announcements',
      component: AnnouncementView,
      meta: { requiresAuth: true, role: 'admin_manager' },
    },
  ],
});

// 3. KIỂM TRA QUYỀN TRUY CẬP (MIDDLEWARE)
router.beforeEach((to, from, next) => {
  // Lấy thông tin user từ localStorage
  const user = JSON.parse(localStorage.getItem('user_info') || 'null');

  // 1. Nếu route yêu cầu đăng nhập mà chưa có user -> Về Login
  if (to.meta.requiresAuth && !user) {
    return next('/login');
  }

  // 2. Nếu đã đăng nhập, kiểm tra vai trò
  if (user) {
    // Nếu là Cư dân (resident)
    if (user.role === 'resident') {
      // Cư dân chỉ được vào /portal và các trang con của nó
      // Không được vào các trang có meta role 'admin_manager' hoặc 'admin_only'
      if (to.meta.role === 'admin_manager' || to.meta.role === 'admin_only') {
        return next('/portal');
      }
    }

    // Nếu là Admin/Manager
    else if (['admin', 'manager'].includes(user.role)) {
      // Admin không cần vào trang Portal của dân
      if (to.meta.role === 'resident') {
        return next('/dashboard');
      }

      // Kiểm tra quyền "admin_only" (Trang Nhân sự)
      if (to.meta.role === 'admin_only' && user.role !== 'admin') {
        alert('Bạn không có quyền truy cập trang này!');
        return next('/dashboard');
      }
    }
  }

  next();
});

export default router;
