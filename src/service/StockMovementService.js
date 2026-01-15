import axios from 'axios';
const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class StockMovementService {
    getAll = async (params = {}) => {
        return await axios.get(`${apiPath}/estoque/movimentacoes`, { params });
    };

    ajuste = async (data) => {
        return await axios.post(`${apiPath}/estoque/movimentacoes/ajuste`, data);
    };

    entrada = async (data) => {
        return await axios.post(`${apiPath}/estoque/movimentacoes/entrada`, data);
    };

    transferir = async (data) => {
        return await axios.post(`${apiPath}/estoque/movimentacoes/transferir`, data);
    };
}

