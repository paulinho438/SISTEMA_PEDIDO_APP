import axios from 'axios';
const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class StockService {
    getAll = async (params = {}) => {
        return await axios.get(`${apiPath}/estoque`, { params });
    };

    get = async (id) => {
        return await axios.get(`${apiPath}/estoque/${id}`);
    };

    reservar = async (id, data) => {
        return await axios.post(`${apiPath}/estoque/${id}/reservar`, data);
    };

    liberar = async (id, data) => {
        return await axios.post(`${apiPath}/estoque/${id}/liberar`, data);
    };

    cancelarReserva = async (id, data) => {
        return await axios.post(`${apiPath}/estoque/${id}/cancelar-reserva`, data);
    };

    darSaida = async (id, data) => {
        return await axios.post(`${apiPath}/estoque/${id}/dar-saida`, data);
    };

    darSaidaECriarAtivo = async (id, data) => {
        return await axios.post(`${apiPath}/estoque/${id}/dar-saida-criar-ativo`, data);
    };

    transferirESair = async (id, data) => {
        return await axios.post(`${apiPath}/estoque/${id}/transferir-e-sair`, data);
    };

    reservasPorSolicitante = async () => {
        return await axios.get(`${apiPath}/estoque/reservas-por-solicitante`);
    };

    darSaidaMultipla = async (data) => {
        return await axios.post(`${apiPath}/estoque/dar-saida-multipla`, data);
    };

    gerarTermoResponsabilidade = async (data) => {
        return await axios.post(`${apiPath}/estoque/gerar-termo-responsabilidade`, data, {
            responseType: 'blob'
        });
    };
}

