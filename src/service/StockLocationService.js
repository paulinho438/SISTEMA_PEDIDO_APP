import axios from 'axios';
const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class StockLocationService {
    get = async (id) => {
        return await axios.get(`${apiPath}/estoque/locais/${id}`);
    };

    getAll = async (params = {}) => {
        return await axios.get(`${apiPath}/estoque/locais`, { params });
    };

    getAllActive = async (params = {}) => {
        return await axios.get(`${apiPath}/estoque/locais/all-active`, { params });
    };

    save = async (location) => {
        if (undefined === location.id) {
            return await axios.post(`${apiPath}/estoque/locais`, location);
        } else {
            return await axios.put(`${apiPath}/estoque/locais/${location.id}`, location);
        }
    };

    toggleActive = async (id) => {
        return await axios.patch(`${apiPath}/estoque/locais/${id}/toggle-active`);
    };
}

