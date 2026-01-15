import axios from 'axios';
const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class AssetAuxiliaryService {
    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    getAll = async (params = {}) => {
        return await axios.get(`${apiPath}/ativos/${this.endpoint}`, { params });
    };

    save = async (item) => {
        if (undefined === item.id) {
            return await axios.post(`${apiPath}/ativos/${this.endpoint}`, item);
        } else {
            return await axios.put(`${apiPath}/ativos/${this.endpoint}/${item.id}`, item);
        }
    };

    delete = async (id) => {
        return await axios.delete(`${apiPath}/ativos/${this.endpoint}/${id}`);
    };
}

