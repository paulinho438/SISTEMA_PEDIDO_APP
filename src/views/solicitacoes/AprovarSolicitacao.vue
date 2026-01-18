<template>
  <div class="card p-5 bg-page">
    <!-- Cabeçalho -->
    <div class="flex justify-content-between align-items-center mb-4">
      <div class="flex align-items-center">
        <Button icon="pi pi-arrow-left" class="p-button-text mr-2" @click="voltar" />
        <h4 class="m-0 text-900">Aprovar solicitação</h4>
        <span v-if="carregando" class="ml-3 text-600 text-sm">Carregando...</span>
      </div>
      <Button
          label="Imprimir PDF"
          icon="pi pi-print"
          class="p-button-info"
          :loading="imprimindo"
          :disabled="imprimindo || !solicitacao.id"
          @click="imprimirPDF"
      />
    </div>

    <!-- Bloco Identificação -->
    <div class="card shadow-none bg-light p-4 mb-4">
      <h5 class="mb-3 text-900">Identificação da Solicitação</h5>

      <div class="grid text-sm">
        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Número da solicitação</label>
          <p class="text-900 font-semibold">{{ solicitacao.numero }}</p>
        </div>

        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Data da Solicitação</label>
          <p class="text-900 font-semibold">{{ solicitacao.data }}</p>
        </div>

        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Empresa</label>
          <p class="text-900 font-semibold">{{ solicitacao.empresa }}</p>
        </div>

        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Local</label>
          <p class="text-900 font-semibold">{{ solicitacao.local }}</p>
        </div>

        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Solicitante</label>
          <p class="text-900 font-semibold">{{ solicitacao.solicitante }}</p>
        </div>
      </div>

      <!-- Tabela de Itens -->
      <DataTable
          :value="tabelaItens"
          class="p-datatable-sm tabela-aprovar mt-4"
          responsiveLayout="scroll"
      >
        <Column field="codigo" header="Código" />
        <Column field="referencia" header="Referência" />
        <Column field="mercadoria" header="Mercadoria" />
        <Column field="quantidade" header="Quant solicitada" />
        <Column field="unidade" header="Medida" />
        <Column field="aplicacao" header="Aplicação" />
        <Column field="prioridade" header="Prioridade dias" />
        <Column field="tag" header="TAG" />
        <Column header="Centro de custo">
          <template #body="{ data }">
            {{ formatarCentroCusto(data.centroCusto) }}
          </template>
        </Column>
      </DataTable>

      <!-- Observação -->
      <div class="mt-4">
        <label class="block text-600 mb-1">Observação</label>
        <p class="text-900">{{ solicitacao.observacao || '-' }}</p>
      </div>
    </div>

    <div class="card shadow-none bg-light p-4 mb-4">
      <label class="block text-600 mb-1">Justificativa / Motivo</label>
      <Textarea v-model="observacao" rows="3" class="w-full" placeholder="Informe a justificativa ou motivo da aprovação" />
    </div>

    <!-- Botões -->
    <div class="flex justify-content-end gap-2">
      <Button
          label="Reprovar"
          icon="pi pi-times"
          class="p-button-danger"
          :loading="salvando"
          :disabled="salvando"
          @click="abrirModalReprovar"
      />
      <Button
          label="Aprovar"
          icon="pi pi-check"
          class="p-button-success"
          :loading="salvando"
          :disabled="salvando"
          @click="aprovar"
      />
    </div>

    <Toast />

    <!-- Modal de Reprovação -->
    <Dialog
        v-model:visible="modalReprovar"
        header="Confirmar Reprovação"
        :style="{ width: '500px' }"
        :modal="true"
        :closable="true"
    >
      <div class="flex flex-column gap-3">
        <p class="text-700 m-0">
          Informe o motivo da reprovação. Esta mensagem será visível para o solicitante ao editar a solicitação.
        </p>
        
        <div>
          <label class="block text-600 mb-2 font-medium">Motivo da Reprovação *</label>
          <Textarea
              v-model="mensagemReprovacao"
              rows="5"
              class="w-full"
              placeholder="Descreva o motivo da reprovação..."
              :disabled="salvando"
          />
          <small v-if="!mensagemReprovacao.trim() && tentouConfirmar" class="text-red-500 block mt-1">
            O motivo da reprovação é obrigatório.
          </small>
        </div>
      </div>

      <template #footer>
        <Button
            label="Cancelar"
            icon="pi pi-times"
            class="p-button-text"
            :disabled="salvando"
            @click="fecharModalReprovar"
        />
        <Button
            label="Confirmar Reprovação"
            icon="pi pi-check"
            class="p-button-danger"
            :loading="salvando"
            :disabled="salvando"
            @click="confirmarReprovar"
        />
      </template>
    </Dialog>
  </div>
</template>

<script>
import { reactive, ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import SolicitacaoService from '@/service/SolicitacaoService';

export default {
  name: 'AprovarSolicitacao',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();

    const solicitacao = reactive({
      id: null,
      numero: '',
      data: '',
      empresa: '',
      local: '',
      solicitante: '',
      observacao: '',
      items: [],
      status: null,
    });

    const carregando = ref(false);
    const salvando = ref(false);
    const observacao = ref('');
    const modalReprovar = ref(false);
    const mensagemReprovacao = ref('');
    const tentouConfirmar = ref(false);
    const imprimindo = ref(false);

    const formatarCentroCusto = (centroCusto) => {
      if (!centroCusto) return '-';
      
      // Se for string (formato antigo), retornar como está
      if (typeof centroCusto === 'string') {
        return centroCusto;
      }
      
      // Se for objeto, formatar código - descrição
      if (typeof centroCusto === 'object') {
        const codigo = centroCusto?.codigo || centroCusto?.CTT_CUSTO || '';
        const descricao = centroCusto?.descricao || centroCusto?.CTT_DESC01 || '';
        
        if (codigo && descricao) {
          return `${codigo} - ${descricao}`;
        }
        
        return codigo || descricao || '-';
      }
      
      return '-';
    };

    const tabelaItens = computed(() =>
      solicitacao.items.map((item) => ({
        codigo: item.codigo,
        referencia: item.referencia,
        mercadoria: item.mercadoria,
        quantidade: item.quantidade,
        unidade: item.unidade,
        aplicacao: item.aplicacao,
        prioridade: item.prioridade,
        tag: item.tag,
        centroCusto: item.centro_custo,
      }))
    );

    const carregarDados = async () => {
      try {
        carregando.value = true;
        const { data } = await SolicitacaoService.show(route.params.id);
        const detalhe = data?.data ?? {};

        solicitacao.id = detalhe.id;
        solicitacao.numero = detalhe.numero;
        solicitacao.data = detalhe.data;
        // Garantir que a empresa mostra a razão social se disponível
        solicitacao.empresa = typeof detalhe.empresa === 'object' ? detalhe.empresa?.label || '-' : detalhe.empresa || '-';
        solicitacao.local = detalhe.local;
        solicitacao.solicitante = detalhe.solicitante || detalhe.requester;
        solicitacao.observacao = detalhe.observacao;
        solicitacao.items = detalhe.itens || [];
        solicitacao.status = detalhe.status;

        const slugAtual = detalhe.status?.slug;
        const statusPermitidos = ['aguardando', 'analisada', 'analisada_aguardando', 'analise_gerencia'];

        if (slugAtual && !statusPermitidos.includes(slugAtual)) {
          toast.add({
            severity: 'info',
            summary: 'Solicitação redirecionada',
            detail: 'O fluxo atual dessa solicitação é tratado em outra tela.',
            life: 3000,
          });
          const destino = slugAtual === 'autorizado' ? 'vincularSolicitacao' : 'solicitacoesPendentes';
          router.push({ name: destino, params: { id: detalhe.id } });
          return;
        }
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível carregar a solicitação.';
        toast.add({ severity: 'error', summary: 'Erro', detail, life: 4000 });
        router.push({ name: 'solicitacoesPendentes' });
      } finally {
        carregando.value = false;
      }
    };

    const voltar = () => router.push({ name: 'solicitacoesPendentes' });

    const aprovar = async () => {
      try {
        salvando.value = true;
        await SolicitacaoService.approve(solicitacao.id, { observacao: observacao.value });
        toast.add({ severity: 'success', summary: 'Solicitação aprovada', detail: `${solicitacao.numero} aprovada com sucesso!`, life: 3000 });
        router.push({ name: 'solicitacoesPendentes' });
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível aprovar a solicitação.';
        toast.add({ severity: 'error', summary: 'Erro ao aprovar', detail, life: 4000 });
      } finally {
        salvando.value = false;
      }
    };

    const abrirModalReprovar = () => {
      mensagemReprovacao.value = '';
      tentouConfirmar.value = false;
      modalReprovar.value = true;
    };

    const fecharModalReprovar = () => {
      modalReprovar.value = false;
      mensagemReprovacao.value = '';
      tentouConfirmar.value = false;
    };

    const imprimirPDF = async () => {
      try {
        imprimindo.value = true;
        const response = await SolicitacaoService.imprimir(route.params.id, 'solicitacao');
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível imprimir a solicitação.';
        toast.add({ severity: 'error', summary: 'Erro ao imprimir', detail, life: 4000 });
      } finally {
        imprimindo.value = false;
      }
    };

    const confirmarReprovar = async () => {
      tentouConfirmar.value = true;

      if (!mensagemReprovacao.value.trim()) {
        toast.add({
          severity: 'warn',
          summary: 'Campo obrigatório',
          detail: 'Informe o motivo da reprovação.',
          life: 3000,
        });
        return;
      }

      try {
        salvando.value = true;
        // Enviar 'mensagem' como preferencial, mas também enviar 'observacao' para compatibilidade
        await SolicitacaoService.reject(solicitacao.id, {
          mensagem: mensagemReprovacao.value.trim(),
          observacao: mensagemReprovacao.value.trim(),
        });
        toast.add({
          severity: 'warn',
          summary: 'Solicitação reprovada',
          detail: `${solicitacao.numero} foi reprovada. O solicitante poderá editar a solicitação.`,
          life: 4000,
        });
        fecharModalReprovar();
        router.push({ name: 'solicitacoesPendentes' });
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível reprovar a solicitação.';
        toast.add({ severity: 'error', summary: 'Erro ao reprovar', detail, life: 4000 });
      } finally {
        salvando.value = false;
      }
    };

    onMounted(carregarDados);

    return {
      solicitacao,
      tabelaItens,
      formatarCentroCusto,
      voltar,
      aprovar,
      reprovar: abrirModalReprovar,
      abrirModalReprovar,
      fecharModalReprovar,
      confirmarReprovar,
      carregando,
      salvando,
      observacao,
      modalReprovar,
      mensagemReprovacao,
      tentouConfirmar,
      imprimirPDF,
      imprimindo,
    };
  }
};
</script>

<style scoped>
.bg-page {
  background-color: #f6f9fb;
}
.bg-light {
  background-color: #fff;
  border-radius: 10px;
}

.tabela-aprovar :deep(.p-datatable-thead > tr > th) {
  background-color: #f5fcf6;
  color: #333;
  font-weight: 500;
  border: 1px solid #eaeaea;
}
.tabela-aprovar :deep(.p-datatable-tbody > tr > td) {
  background-color: #fbfefb;
  border: 1px solid #f0f0f0;
  color: #444;
}
.tabela-aprovar :deep(.p-datatable-tbody > tr:hover > td) {
  background-color: #f3faf3;
}
</style>
