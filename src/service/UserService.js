import axios from 'axios';
const apiPath = import.meta.env.VITE_APP_BASE_URL;

export default class UserService {
    getAll = async () => {
        return await axios.get(`${apiPath}/users`);
    };

    get = async (id) => {
        return await axios.get(`${apiPath}/users/${id}`);
    };
}

