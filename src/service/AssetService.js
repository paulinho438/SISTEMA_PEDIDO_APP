import axios from 'axios';
const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class AssetService {
    getAll = async (params = {}) => {
        return await axios.get(`${apiPath}/ativos`, { params });
    };

    buscar = async (params = {}) => {
        return await axios.get(`${apiPath}/ativos/buscar`, { params });
    };

    get = async (id) => {
        return await axios.get(`${apiPath}/ativos/${id}`);
    };

    save = async (asset) => {
        if (undefined === asset.id) {
            return await axios.post(`${apiPath}/ativos`, asset);
        } else {
            return await axios.put(`${apiPath}/ativos/${asset.id}`, asset);
        }
    };

    baixar = async (id, data) => {
        return await axios.post(`${apiPath}/ativos/${id}/baixar`, data);
    };

    transferir = async (id, data) => {
        return await axios.post(`${apiPath}/ativos/${id}/transferir`, data);
    };

    alterarResponsavel = async (id, data) => {
        return await axios.post(`${apiPath}/ativos/${id}/alterar-responsavel`, data);
    };
}

