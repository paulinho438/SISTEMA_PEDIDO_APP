import axios from '@/plugins/axios';

class RelatorioService {
  custosPorCentroCusto(params = {}) {
    return axios.get('/relatorios/custos-centro-custo', { params });
  }

  relatorioCotacoes(params = {}) {
    return axios.get('/relatorios/cotacoes', { params });
  }

  custosPorFornecedor(params = {}) {
    return axios.get('/relatorios/custos-fornecedor', { params });
  }

  custosPorSolicitacao(params = {}) {
    return axios.get('/relatorios/custos-solicitacao', { params });
  }

  historicoPorPeriodo(params = {}) {
    return axios.get('/relatorios/historico-periodo', { params });
  }
}

export default new RelatorioService();

