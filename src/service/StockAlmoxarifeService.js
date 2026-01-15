import axios from 'axios';
const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class StockAlmoxarifeService {
    listAlmoxarifes = async () => {
        return await axios.get(`${apiPath}/estoque/almoxarifes`);
    };

    listByLocation = async (locationId) => {
        return await axios.get(`${apiPath}/estoque/locais/${locationId}/almoxarifes`);
    };

    listByAlmoxarife = async (userId) => {
        return await axios.get(`${apiPath}/estoque/almoxarifes/${userId}/locais`);
    };

    associate = async (locationId, userId) => {
        return await axios.post(`${apiPath}/estoque/locais/${locationId}/almoxarifes`, { user_id: userId });
    };

    disassociate = async (locationId, userId) => {
        return await axios.delete(`${apiPath}/estoque/locais/${locationId}/almoxarifes/${userId}`);
    };

    associateMultiple = async (userId, locationIds) => {
        return await axios.post(`${apiPath}/estoque/almoxarifes/${userId}/locais`, { location_ids: locationIds });
    };

    disassociateMultiple = async (userId, locationIds) => {
        return await axios.delete(`${apiPath}/estoque/almoxarifes/${userId}/locais`, { data: { location_ids: locationIds } });
    };
}

