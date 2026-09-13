
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000'; 

export const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, {
            email,
            senha: password
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw error.response.data;
        } else {
            throw { message: 'Erro de conexão com o servidor' };
        }
    }
};
