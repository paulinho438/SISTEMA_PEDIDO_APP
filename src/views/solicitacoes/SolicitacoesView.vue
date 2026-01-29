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
          <Column header="N°">
            <template #body="{ index }">
              {{ index + 1 }}
            </template>
          </Column>
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

      <!-- Mensagem de Reprovação -->
      <div v-if="solicitacao.status?.slug === 'reprovado' && mensagensReprovacao.length > 0" class="mt-4">
        <Message severity="error" :closable="false">
          <div class="flex flex-column gap-2">
            <strong class="block">Motivo da Reprovação:</strong>
            <div v-for="(mensagem, index) in mensagensReprovacao" :key="mensagem.id || index" class="flex flex-column">
              <div class="text-700">{{ mensagem.mensagem }}</div>
              <small class="text-500">Por: {{ mensagem.autor }} em {{ mensagem.data }}</small>
            </div>
          </div>
        </Message>
      </div>

      <!-- Mensagem de Reset (solicitação foi resetada e voltou para Aguardando) -->
      <div v-if="solicitacao.status?.slug === 'aguardando' && solicitacao.reset_reason" class="mt-4">
        <Message severity="warn" :closable="false">
          <div class="flex flex-column gap-2">
            <strong class="block">Solicitação resetada</strong>
            <div class="text-700">{{ solicitacao.reset_reason }}</div>
            <small class="text-500" v-if="solicitacao.reset_by_name || solicitacao.reset_at">
              Por: {{ solicitacao.reset_by_name || 'Sistema' }} em {{ solicitacao.reset_at || '' }}
            </small>
            <p class="text-600 text-sm mt-2 mb-0">
              Você pode editar a solicitação e enviá-la novamente para aprovação.
            </p>
          </div>
        </Message>
      </div>

      <div class="mt-4">
        <label class="block text-600 mb-1">Observação</label>
        <p class="text-900">{{ solicitacao.observacao || '-' }}</p>
      </div>
    </div>

    <!-- Histórico da Solicitação -->
    <div v-if="historicoFormatado && historicoFormatado.length > 0" class="card shadow-none bg-light p-4">
      <h5 class="mb-3 text-900">Histórico da Solicitação</h5>
      <Timeline :value="historicoFormatado" class="p-timeline-vertical">
        <template #marker="slotProps">
          <span
              class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-2"
              :style="{ backgroundColor: getCorTipo(slotProps.item.tipo) }"
          >
            <i :class="getIconeTipo(slotProps.item.tipo)"></i>
          </span>
        </template>
        <template #content="slotProps">
          <div class="flex flex-column">
            <div class="flex align-items-center gap-2 mb-2">
              <span class="font-semibold text-900">{{ slotProps.item.acao }}</span>
              <Tag
                  :value="slotProps.item.status || slotProps.item.nivel_label"
                  :severity="getSeverityTipo(slotProps.item.tipo)"
                  :style="getStyleTipo(slotProps.item.tipo)"
              />
            </div>
            <div class="text-600 mb-2">
              <i class="pi pi-user mr-2"></i>
              <span>{{ slotProps.item.usuario }}</span>
            </div>
            <div class="text-500 mb-2" v-if="slotProps.item.observacao">
              <i class="pi pi-comment mr-2"></i>
              <span>{{ slotProps.item.observacao }}</span>
            </div>
            <div class="text-500 text-sm">
              <i class="pi pi-calendar mr-2"></i>
              <span>{{ slotProps.item.data }}</span>
            </div>
          </div>
        </template>
      </Timeline>
    </div>

    <Toast />
  </div>
</template>

<script>
import { reactive, ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import SolicitacaoService from '@/service/SolicitacaoService';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';
import Message from 'primevue/message';
import Timeline from 'primevue/timeline';

export default {
  name: 'SolicitacoesView',
  components: {
    Button,
    DataTable,
    Column,
    Tag,
    ProgressSpinner,
    Toast,
    Message,
    Timeline,
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
      observacao: '',
      centro_custo: null,
      itens: [],
      status: null,
      mensagens: [],
      historico: [],
    });

    const historico = ref([]);

    const carregando = ref(false);
    const carregandoPDF = ref(false);

    // Filtrar mensagens de reprovação
    const mensagensReprovacao = computed(() => {
      if (!solicitacao.mensagens || !Array.isArray(solicitacao.mensagens)) {
        return [];
      }
      return solicitacao.mensagens.filter(msg => msg.tipo === 'reprova');
    });

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
        solicitacao.mensagens = detalhe.mensagens || [];
        historico.value = detalhe.historico || [];
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
        carregandoPDF.value = false;
      }
    };

    const voltar = () => router.push({ name: 'solicitacoesList' });

    const historicoFormatado = computed(() => {
      return historico.value.map(item => ({
        ...item,
        key: `${item.tipo}-${item.timestamp || Date.now()}`,
      }));
    });

    const getCorTipo = (tipo) => {
      const cores = {
        status: '#6366f1',
        aprovacao: '#10b981',
        reprovacao: '#ef4444',
      };
      return cores[tipo] || '#6b7280';
    };

    const getIconeTipo = (tipo) => {
      const icones = {
        status: 'pi pi-sync',
        aprovacao: 'pi pi-check',
        reprovacao: 'pi pi-times',
      };
      return icones[tipo] || 'pi pi-info-circle';
    };

    const getSeverityTipo = (tipo) => {
      const severities = {
        status: 'info',
        aprovacao: 'success',
        reprovacao: 'danger',
      };
      return severities[tipo] || 'secondary';
    };

    const getStyleTipo = (tipo) => {
      const styles = {
        status: { backgroundColor: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' },
        aprovacao: { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' },
        reprovacao: { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' },
      };
      return styles[tipo] || {};
    };

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
      mensagensReprovacao,
      historico,
      historicoFormatado,
      getCorTipo,
      getIconeTipo,
      getSeverityTipo,
      getStyleTipo,
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
