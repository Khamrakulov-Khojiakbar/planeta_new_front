import axios from 'axios';

// Создаем настроенный экземпляр axios
const api = axios.create({
  // URL твоего запущенного бэкенда .NET. Перепроверь порт (у тебя в launchSettings.json обычно https)
  baseURL: 'https://www.planeta.somee.com', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Перехватчик (Interceptor): срабатывает ПЕРЕД каждым запросом к серверу
api.interceptors.request.use(
  (config) => {
    // Вытаскиваем токен из памяти браузера
    const token = localStorage.getItem('token');
    
    // Если токен есть, автоматически добавляем заголовок Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;