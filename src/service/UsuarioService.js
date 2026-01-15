import axios from 'axios';

const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class ClientService {
    get = async (id) => {
        return await axios.get(`${apiPath}/usuario/${id}`);
    };

    getAll = async () => {
        return await axios.get(`${apiPath}/usuario`);
    };

    delete = async (id) => {
        return await axios.get(`${apiPath}/usuario/${id}/delete`);
    };

    save = async (payload, formData = null) => {
        // Blindagem: payload nunca pode ser null/undefined
        const data = payload || {};

        // Se tiver FormData (com arquivo), usar método específico
        if (formData instanceof FormData) {
            return await this.saveWithSignature(formData);
        }

        // Insert
        if (data.id == null) {
            return await axios.post(`${apiPath}/usuario`, data);
        }

        // Update
        return await axios.put(`${apiPath}/usuario/${data.id}`, data);
    };

    saveWithSignature = async (formData) => {
        if (!(formData instanceof FormData)) {
            throw new Error('saveWithSignature requer FormData');
        }

        const userId = formData.get('id');
        const url = userId ? `${apiPath}/usuario/${userId}` : `${apiPath}/usuario`;

        // Laravel: para update com multipart geralmente usa POST + _method=PUT
        if (userId) {
            // Evita duplicar _method se salvar mais de uma vez
            if (!formData.get('_method')) formData.append('_method', 'PUT');
        }

        return await axios.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    };

    getSignatureUrl = (signaturePath) => {
        if (!signaturePath) return null;
        return `${apiPath.replace('/api', '')}/storage/${signaturePath}`;
    };

    getSignaturesByProfile = async (quoteId = null) => {
        const url = quoteId 
            ? `${apiPath}/usuario/assinaturas-por-perfil?quote_id=${quoteId}`
            : `${apiPath}/usuario/assinaturas-por-perfil`;
        return await axios.get(url);
    };

    // GESTAO DE EMPRESAS
    getAllUsuariosCompany = async (id) => {
        return await axios.get(`${apiPath}/gestao/usuariosempresa/${id}`);
    };
}
