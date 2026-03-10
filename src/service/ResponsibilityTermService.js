import axios from '@/plugins/axios';

export default {
  list(params = {}) {
    return axios.get('/estoque/termos-responsabilidade', { params });
  },

  get(id) {
    return axios.get(`/estoque/termos-responsabilidade/${id}`);
  },

  create(payload) {
    return axios.post('/estoque/termos-responsabilidade', payload);
  },

  devolver(id, payload = {}) {
    return axios.post(`/estoque/termos-responsabilidade/${id}/devolver`, payload);
  },

  pdf(id) {
    return axios.get(`/estoque/termos-responsabilidade/${id}/pdf`, {
      responseType: 'blob',
    });
  },
};
