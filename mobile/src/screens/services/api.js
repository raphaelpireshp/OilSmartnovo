import axios from 'axios';

// Configuração base da API
const api = axios.create({
  baseURL: 'https://shawana-awkward-sarina.ngrok-free.dev/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Interceptor para logging de requests
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 [API] ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data) {
      console.log('📦 Request Data:', config.data);
    }
    return config;
  },
  (error) => {
    console.error('❌ [API] Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logging de responses
api.interceptors.response.use(
  (response) => {
    console.log(`✅ [API] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`❌ [API] ${error.response?.status || 'NO STATUS'} ${error.config?.url}`);
    console.error('📦 Error Response:', error.response?.data);
    
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      console.log('🔐 Token inválido, redirecionando para login...');
      // Você pode adicionar lógica de logout aqui se necessário
    }
    
    return Promise.reject(error);
  }
);

export default api;