import axios from 'axios';
const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class PurchaseOrderService {
    get = async (id) => {
        return await axios.get(`${apiPath}/pedidos-compra/${id}`);
    };

    getAll = async (params = {}) => {
        return await axios.get(`${apiPath}/pedidos-compra`, { params });
    };

    buscarPorCotacao = async (quoteId) => {
        return await axios.get(`${apiPath}/pedidos-compra/cotacao/${quoteId}`);
    };

    gerarPedidosCotacao = async (quoteId) => {
        return await axios.post(`${apiPath}/pedidos-compra/cotacao/${quoteId}/gerar`);
    };

    imprimir = async (id) => {
        // Fazer requisição com responseType blob para PDF
        const response = await axios.get(`${apiPath}/pedidos-compra/${id}/imprimir`, {
            responseType: 'blob',
            headers: {
                'Accept': 'application/pdf'
            }
        });

        // Criar blob do PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        
        // Criar URL temporária
        const url = window.URL.createObjectURL(blob);
        
        // Abrir PDF em nova aba para visualização/impressão
        window.open(url, '_blank');
        
        // Limpar URL após um tempo (opcional)
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 100);
        
        return response;
    };
}

