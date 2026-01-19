import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import './assets/main.css'; // <--- Dòng này phải khớp với vị trí file vừa tạo

const app = createApp(App);
app.use(router);
app.mount('#app');
