import axios from '@/plugins/axios';
const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class StockTransferService {
    getAll = async (params = {}) => {
        return await axios.get(`${apiPath}/estoque/transferencias`, { params });
    };

    getById = async (id) => {
        return await axios.get(`${apiPath}/estoque/transferencias/${id}`);
    };

    criar = async (data) => {
        return await axios.post(`${apiPath}/estoque/transferencias`, data);
    };

    receber = async (id, dados = {}) => {
        return await axios.post(`${apiPath}/estoque/transferencias/${id}/receber`, dados);
    };

    excluir = async (id) => {
        return await axios.delete(`${apiPath}/estoque/transferencias/${id}`);
    };

    gerarDocumento = async (id) => {
        return await axios.get(`${apiPath}/estoque/transferencias/${id}/documento`, {
            responseType: 'blob',
        });
    };
}

