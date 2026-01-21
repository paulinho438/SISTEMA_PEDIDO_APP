import axios from 'axios';
const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class PurchaseInvoiceService {
    getAll = async (params = {}) => {
        return await axios.get(`${apiPath}/notas-fiscais`, { params });
    };

    getById = async (id) => {
        return await axios.get(`${apiPath}/notas-fiscais/${id}`);
    };

    buscarPedido = async (orderId) => {
        return await axios.get(`${apiPath}/notas-fiscais/pedido/${orderId}`);
    };

    create = async (data) => {
        return await axios.post(`${apiPath}/notas-fiscais`, data);
    };
}
