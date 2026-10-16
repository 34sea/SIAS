import axios from 'axios';

/**
 * Instância axios configurada para a API do SIAS (backend Node.js na porta 5000).
 * O token JWT é injetado automaticamente em cada requisição a partir do localStorage.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    },
});

// Interceptor de requisição: adiciona o token Bearer se existir
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('sias_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de resposta: limpa o token em 401 e propaga o erro
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('sias_token');
            localStorage.removeItem('sias_user');
            // Não redireciona automaticamente para evitar loops; a view trata.
        }
        return Promise.reject(error);
    }
);

export default api;
