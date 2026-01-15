import axios from 'axios';
const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class StockProductService {
    get = async (id) => {
        return await axios.get(`${apiPath}/estoque/produtos/${id}`);
    };

    getAll = async (params = {}) => {
        return await axios.get(`${apiPath}/estoque/produtos`, { params });
    };

    buscar = async (params = {}) => {
        return await axios.get(`${apiPath}/estoque/produtos/buscar`, { params });
    };

    save = async (product) => {
        if (undefined === product.id) {
            return await axios.post(`${apiPath}/estoque/produtos`, product);
        } else {
            return await axios.put(`${apiPath}/estoque/produtos/${product.id}`, product);
        }
    };

    toggleActive = async (id) => {
        return await axios.patch(`${apiPath}/estoque/produtos/${id}/toggle-active`);
    };

    saveWithProtheus = async (product) => {
        return await axios.post(`${apiPath}/estoque/produtos/cadastrar-com-protheus`, product);
    };

    buscarCombinado = async (params = {}) => {
        return await axios.get(`${apiPath}/estoque/produtos/buscar-combinado`, { params });
    };
}

