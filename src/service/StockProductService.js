import axios from '@/plugins/axios';

export default class StockProductService {
    get = async (id) => {
        return await axios.get(`/estoque/produtos/${id}`);
    };

    getAll = async (params = {}) => {
        return await axios.get('/estoque/produtos', { params });
    };

    buscar = async (params = {}, config = {}) => {
        console.log('[StockProductService] buscar INÍCIO', { params, config });
        try {
            const res = await axios.get('/estoque/produtos/buscar', { params, ...config });
            console.log('[StockProductService] buscar OK', { status: res?.status, dataKeys: res?.data ? Object.keys(res.data) : [] });
            return res;
        } catch (err) {
            console.error('[StockProductService] buscar ERRO:', err);
            console.error('[StockProductService] err.response:', err?.response);
            console.error('[StockProductService] err.response?.data:', err?.response?.data);
            throw err;
        }
    };

    save = async (product) => {
        if (undefined === product.id) {
            return await axios.post('/estoque/produtos', product);
        } else {
            return await axios.put(`/estoque/produtos/${product.id}`, product);
        }
    };

    toggleActive = async (id) => {
        return await axios.patch(`/estoque/produtos/${id}/toggle-active`);
    };

    saveWithProtheus = async (product) => {
        return await axios.post('/estoque/produtos/cadastrar-com-protheus', product);
    };

    buscarCombinado = async (params = {}) => {
        return await axios.get('/estoque/produtos/buscar-combinado', { params });
    };

    uploadImage = async (id, file) => {
        const formData = new FormData();
        formData.append('image', file);
        return await axios.post(`/estoque/produtos/${id}/upload-image`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    };

    removeImage = async (id) => {
        return await axios.delete(`/estoque/produtos/${id}/remove-image`);
    };

    validarExcel = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return await axios.post('/estoque/produtos/validar-excel', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    };

    importarExcel = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return await axios.post('/estoque/produtos/importar-excel', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    };

    baixarTemplate = async () => {
        return await axios.get('/estoque/produtos/template-excel', {
            responseType: 'blob'
        });
    };
}

