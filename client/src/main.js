import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import './assets/main.css';
import axios from 'axios';
// Chỉ sử dụng đường dẫn tương đối để Vite Proxy có thể hoạt động
axios.defaults.baseURL = '/api';

const app = createApp(App);
app.use(router);
app.mount('#app');
