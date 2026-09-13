
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';

export const getAlerts = async () => {
    try {
        const response = await axios.get(`${API_URL}/alertas`);
        return response.data;
    } catch (err) {
        console.error(err);
        return [];
    }
};
