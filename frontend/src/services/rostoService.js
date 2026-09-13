
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const getRostos = async () => {
    try {
        const response = await axios.get(`${API_URL}/rostos`);
        return response.data;
    } catch (err) {
        console.error(err);
        return [];
    }
};
