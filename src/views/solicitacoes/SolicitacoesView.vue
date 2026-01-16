<template>
  <div class="card p-5 bg-page">
    <div class="flex align-items-center justify-content-between mb-4">
      <div class="flex align-items-center">
        <Button icon="pi pi-arrow-left" class="p-button-text mr-2" @click="voltar" />
        <h4 class="m-0 text-900">Visualizar Solicitação</h4>
      </div>
      <Button
          label="Imprimir PDF"
          icon="pi pi-file-pdf"
          class="p-button-outlined p-button-info"
          @click="imprimirPDF"
          :loading="carregandoPDF"
      />
    </div>

    <div v-if="carregando" class="flex justify-content-center align-items-center" style="min-height: 400px;">
      <ProgressSpinner />
    </div>

    <div v-else class="card shadow-none bg-light p-4 mb-4">
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
          <p class="text-900 font-semibold">{{ solicitacao.local || '-' }}</p>
        </div>

        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Solicitante</label>
          <p class="text-900 font-semibold">{{ solicitacao.solicitante }}</p>
        </div>

        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Frente de Obra</label>
          <p class="text-900 font-semibold">{{ solicitacao.frente_obra || '-' }}</p>
        </div>

        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Status</label>
          <Tag
              :value="solicitacao.status?.label || '-'"
              :severity="getSeverityStatus(solicitacao.status?.slug)"
              :style="getStyleStatus(solicitacao.status?.slug)"
          />
        </div>

        <div class="col-12 md:col-4" v-if="solicitacao.centro_custo">
          <label class="text-600 block mb-1">Centro de custo principal</label>
          <p class="text-900 font-semibold">
            {{ formatarCentroCusto(solicitacao.centro_custo) }}
          </p>
        </div>
      </div>

      <div class="mt-4">
        <label class="block text-600 mb-2">Itens da Solicitação</label>
        <DataTable
            :value="solicitacao.itens"
            class="p-datatable-sm tabela-view"
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
              {{ formatarCentroCusto(data.centro_custo) }}
            </template>
          </Column>
        </DataTable>
      </div>

      <div class="mt-4">
        <label class="block text-600 mb-1">Observação</label>
        <p class="text-900">{{ solicitacao.observacao || '-' }}</p>
      </div>
    </div>

    <Toast />
  </div>
</template>

<script>
import { reactive, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import SolicitacaoService from '@/service/SolicitacaoService';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';

export default {
  name: 'SolicitacoesView',
  components: {
    Button,
    DataTable,
    Column,
    Tag,
    ProgressSpinner,
    Toast,
  },
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
      frente_obra: '',
      observacao: '',
      centro_custo: null,
      itens: [],
      status: null,
    });

    const carregando = ref(false);
    const carregandoPDF = ref(false);

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

    const getSeverityStatus = (statusSlug) => {
      const statusMap = {
        aguardando: 'warning',
        analisada: 'success',
        analisada_aguardando: 'help',
        analise_gerencia: 'info',
        aprovado: 'success',
        reprovado: 'danger',
        compra_em_andamento: 'info',
        cotacao: 'warning',
        finalizada: 'info',
      };
      return statusMap[statusSlug] || 'secondary';
    };

    const getStyleStatus = (statusSlug) => {
      const styleMap = {
        aguardando: { backgroundColor: '#fff3cd', color: '#856404', border: '1px solid #ffeaa7' },
        analisada: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
        aprovado: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
        reprovado: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
      };
      return styleMap[statusSlug] || {};
    };

    const carregarDados = async () => {
      try {
        carregando.value = true;
        const solicitacaoId = route.params.id;
        const { data } = await SolicitacaoService.show(solicitacaoId);

        const detalhe = data?.data ?? {};

        solicitacao.id = detalhe.id;
        solicitacao.numero = detalhe.numero || '-';
        solicitacao.data = detalhe.data || '-';
        solicitacao.empresa = typeof detalhe.empresa === 'object' ? detalhe.empresa?.label || '-' : detalhe.empresa || '-';
        solicitacao.local = detalhe.local || '-';
        solicitacao.solicitante = typeof detalhe.solicitante === 'object' ? detalhe.solicitante?.label || '-' : detalhe.solicitante || '-';
        solicitacao.frente_obra = detalhe.frente_obra || detalhe.work_front || '-';
        solicitacao.observacao = detalhe.observacao || '-';
        solicitacao.centro_custo = detalhe.centro_custo || null;
        solicitacao.itens = (detalhe.itens || []).map((item) => ({
          codigo: item.codigo || '-',
          referencia: item.referencia || '-',
          mercadoria: item.mercadoria || '-',
          quantidade: item.quantidade || 0,
          unidade: item.unidade || '-',
          aplicacao: item.aplicacao || '-',
          prioridade: item.prioridade || '-',
          tag: item.tag || '-',
          centro_custo: item.centro_custo || null,
        }));
        solicitacao.status = detalhe.status || null;
      } catch (error) {
        console.error('Erro ao carregar solicitação', error);
        toast.add({
          severity: 'error',
          summary: 'Erro ao carregar',
          detail: error?.response?.data?.message || 'Não foi possível carregar os dados da solicitação.',
          life: 4000
        });
        router.push({ name: 'solicitacoesList' });
      } finally {
        carregando.value = false;
      }
    };

    const imprimirPDF = async () => {
      if (!route.params.id) {
        toast.add({ severity: 'warn', summary: 'Aviso', detail: 'Não foi possível identificar a solicitação.', life: 3000 });
        return;
      }

      try {
        carregandoPDF.value = true;
        const response = await SolicitacaoService.imprimir(route.params.id);
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
        carregandoPDF.value = false;
      }
    };

    const voltar = () => router.push({ name: 'solicitacoesList' });

    onMounted(() => {
      carregarDados();
    });

    return {
      solicitacao,
      carregando,
      carregandoPDF,
      formatarCentroCusto,
      getSeverityStatus,
      getStyleStatus,
      imprimirPDF,
      voltar,
    };
  }
};
</script>

<style scoped>
.bg-page {
  background: #f5f5f5;
}

.tabela-view :deep(.p-datatable-thead > tr > th) {
  background-color: #f5fcf6;
  color: #333;
  font-weight: 500;
  border: 1px solid #eaeaea;
}

.tabela-view :deep(.p-datatable-tbody > tr > td) {
  background-color: #fbfefb;
  border: 1px solid #f0f0f0;
}
</style>
