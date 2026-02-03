import axios from '@/plugins/axios';

class SolicitacaoService {
  list(params = {}) {
    return axios.get('/cotacoes', { params });
  }

  listBuyers() {
    return axios.get('/cotacoes/buyers');
  }

  listRequesters() {
    return axios.get('/cotacoes/requesters');
  }

  show(id) {
    return axios.get(`/cotacoes/${id}`);
  }

  create(payload) {
    return axios.post('/cotacoes', payload);
  }

  update(id, payload) {
    return axios.put(`/cotacoes/${id}`, payload);
  }

  saveDetails(id, payload) {
    return axios.post(`/cotacoes/${id}/detalhes`, payload);
  }

  finalize(id, payload) {
    return axios.post(`/cotacoes/${id}/finalizar`, payload);
  }

  analyze(id, payload) {
    return axios.post(`/cotacoes/${id}/analisar`, payload);
  }

  reprove(id, payload) {
    return axios.post(`/cotacoes/${id}/reprovar`, payload);
  }

  assignBuyer(id, payload) {
    return axios.post(`/cotacoes/${id}/assign-buyer`, payload);
  }

  assignEngineer(id, payload) {
    return axios.post(`/cotacoes/${id}/assign-engineer`, payload);
  }

  approve(id, payload) {
    return axios.post(`/cotacoes/${id}/approve`, payload);
  }

  reject(id, payload) {
    return axios.post(`/cotacoes/${id}/reject`, payload);
  }

  imprimir(id, tipo = null) {
    const params = tipo ? { tipo } : {};
    return axios.get(`/cotacoes/${id}/imprimir`, {
      params,
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });
  }

  acompanhamento() {
    return axios.get('/cotacoes/acompanhamento');
  }

  analyzeAndSelectApprovals(id, payload) {
    return axios.post(`/cotacoes/${id}/analisar-aprovacoes`, payload);
  }

  resetSolicitacao(id, payload) {
    return axios.post(`/cotacoes/${id}/resetar-solicitacao`, payload);
  }

  approveByLevel(id, level, payload) {
    return axios.post(`/cotacoes/${id}/aprovar-nivel/${level}`, payload);
  }

  delete(id) {
    return axios.delete(`/cotacoes/${id}`);
  }

  alterarQuantidade(id, payload) {
    return axios.post(`/cotacoes/${id}/alterar-quantidade`, payload);
  }

  alterarCentroCusto(id, payload) {
    return axios.post(`/cotacoes/${id}/alterar-centro-custo`, payload);
  }

  alterarCentroCustoItens(id, payload) {
    return axios.put(`/cotacoes/${id}/itens-centro-custo`, payload);
  }
}

export default new SolicitacaoService();
