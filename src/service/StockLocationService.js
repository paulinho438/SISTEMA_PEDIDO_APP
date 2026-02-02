import axios from '@/plugins/axios';

export default class StockLocationService {
    get = async (id) => {
        return await axios.get(`/estoque/locais/${id}`);
    };

    getAll = async (params = {}) => {
        return await axios.get('/estoque/locais', { params });
    };

    getAllActive = async (params = {}) => {
        return await axios.get('/estoque/locais/all-active', { params });
    };

    save = async (location) => {
        if (undefined === location.id) {
            return await axios.post('/estoque/locais', location);
        } else {
            return await axios.put(`/estoque/locais/${location.id}`, location);
        }
    };

    toggleActive = async (id) => {
        return await axios.patch(`/estoque/locais/${id}/toggle-active`);
    };
}

