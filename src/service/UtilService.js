export default class UtilService {
	static message(message) {
		if (!message || message === null || message === undefined) {
			return 'Erro desconhecido';
		}

		// Se não for um objeto, tentar converter para string
		if (typeof message === 'string') {
			return message;
		}

		// Se não for objeto, retornar mensagem padrão
		if (typeof message !== 'object') {
			return String(message) || 'Erro desconhecido';
		}

		let msg = '';

		try {
			// Verificar se message.errors existe e é um objeto válido (não null, não array)
			if (message.errors && typeof message.errors === 'object' && message.errors !== null && !Array.isArray(message.errors)) {
				// É um objeto de erros
				try {
					msg += '<ul class="py-0 pl-3 mx-0 my-0">';
					for (const element in message.errors) {
						if (Object.prototype.hasOwnProperty.call(message.errors, element)) {
							const errorValue = message.errors[element];
							let errorMsg = '';
							
							if (Array.isArray(errorValue)) {
								errorMsg = errorValue.join(', ');
							} else if (errorValue && typeof errorValue === 'object') {
								errorMsg = JSON.stringify(errorValue);
							} else {
								errorMsg = String(errorValue || '');
							}
							
							if (errorMsg) {
								msg += `<li class="mx-0 my-0 px-0 py-0">${errorMsg}</li>`;
							}
						}
					}
					msg += '</ul>';
				} catch (e) {
					// Se houver erro ao iterar, usar mensagem simples
					msg = message?.message || message?.error || 'Erro desconhecido';
				}
			} else if (message.errors && Array.isArray(message.errors)) {
				// É um array de erros
				msg += '<ul class="py-0 pl-3 mx-0 my-0">';
				message.errors.forEach(error => {
					if (error) {
						msg += `<li class="mx-0 my-0 px-0 py-0">${String(error)}</li>`;
					}
				});
				msg += '</ul>';
			} else {
				// Tentar pegar mensagem direta
				msg = message?.message || message?.error || 'Erro desconhecido';
			}
		} catch (e) {
			// Se houver erro ao processar, retornar mensagem padrão
			try {
				msg = message?.message || message?.error || String(message) || 'Erro desconhecido';
			} catch (e2) {
				msg = 'Erro desconhecido';
			}
		}

		return msg || 'Erro desconhecido';
	}
}
