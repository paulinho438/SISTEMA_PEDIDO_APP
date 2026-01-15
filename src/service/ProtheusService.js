import axios from '@/plugins/axios';

export default class ProtheusService {
	getFornecedores(params = {}, config = {}) {
		const requestConfig = { params };
		if (config && Object.keys(config).length) {
			Object.assign(requestConfig, config);
		}
		return axios.get('/protheus/fornecedores', requestConfig);
	}

	getProdutos(params = {}, config = {}) {
		const requestConfig = { params };
		if (config && Object.keys(config).length) {
			Object.assign(requestConfig, config);
		}
		return axios.get('/protheus/produtos', requestConfig);
	}

	getCentrosCusto(params = {}, config = {}) {
		const requestConfig = { params };
		if (config && Object.keys(config).length) {
			Object.assign(requestConfig, config);
		}
		return axios.get('/protheus/centros-custo', requestConfig);
	}

	getCondicoesPagamento(params = {}, config = {}) {
		const requestConfig = { params };
		if (config && Object.keys(config).length) {
			Object.assign(requestConfig, config);
		}
		return axios.get('/protheus/condicoes-pagamento', requestConfig);
	}

	getPedidosCompra(params = {}, config = {}) {
		const requestConfig = { params };
		if (config && Object.keys(config).length) {
			Object.assign(requestConfig, config);
		}
		return axios.get('/protheus/pedidos-compra', requestConfig);
	}

	getItensPedidoCompra(params = {}, config = {}) {
		const requestConfig = { params };
		if (config && Object.keys(config).length) {
			Object.assign(requestConfig, config);
		}
		return axios.get('/protheus/pedidos-compra/itens', requestConfig);
	}

	getCompradores(params = {}, config = {}) {
		const requestConfig = { params };
		if (config && Object.keys(config).length) {
			Object.assign(requestConfig, config);
		}
		return axios.get('/protheus/compradores', requestConfig);
	}

	getNaturezasOperacao(params = {}, config = {}) {
		const requestConfig = { params };
		if (config && Object.keys(config).length) {
			Object.assign(requestConfig, config);
		}
		return axios.get('/protheus/naturezas-operacao', requestConfig);
	}

	getTes(params = {}, config = {}) {
		const requestConfig = { params };
		if (config && Object.keys(config).length) {
			Object.assign(requestConfig, config);
		}
		return axios.get('/protheus/tes', requestConfig);
	}
}

