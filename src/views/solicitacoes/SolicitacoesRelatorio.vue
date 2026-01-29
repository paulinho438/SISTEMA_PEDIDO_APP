<template>
  <div class="card p-4">
    <div class="flex justify-content-between align-items-center mb-4">
      <h4 class="m-0">Relatório de Solicitações</h4>
      <div class="flex align-items-center gap-2">
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText
              v-model="filtroGlobal"
              placeholder="Buscar..."
              class="p-inputtext-sm"
              style="width: 16rem"
              @keyup.enter="() => carregarSolicitacoes(true)"
          />
        </span>
        <Button label="Buscar" icon="pi pi-search" class="p-button-outlined" @click="() => carregarSolicitacoes(true)" />
        <Button
            label="Exportar"
            icon="pi pi-upload"
            class="p-button-outlined"
            @click="exportar"
        />
      </div>
    </div>

    <DataTable
        :value="solicitacoes"
        :paginator="true"
        :rows="rows"
        :totalRecords="totalRecords"
        :lazy="true"
        dataKey="id"
        responsiveLayout="scroll"
        :loading="carregando"
        v-model:expandedRows="expandedRows"
        @rowToggle="onRowToggle"
        :sortField="sortField"
        :sortOrder="sortOrder"
        @sort="onSort"
        @page="onPage"
    >
      <Column :expander="true" headerStyle="width: 3rem" />
      <Column field="numero" header="Nº da Solicitação" sortable></Column>
      <Column field="data" header="Data" sortable></Column>
      <Column field="solicitante" header="Solicitante" sortable></Column>
      <Column header="Centro de Custo" sortable>
        <template #body="slotProps">
          {{ formatarCentroCusto(slotProps.data.centroCusto) }}
        </template>
      </Column>
      <Column field="frenteObra" header="Frente de Obra" sortable></Column>
      <Column header="Status" sortable>
        <template #body="slotProps">
          <Tag
              :value="slotProps.data.status"
              :severity="mapaStatus[slotProps.data.statusSlug] || 'secondary'"
              :style="statusStyle(slotProps.data.statusSlug)"
          />
        </template>
      </Column>

      <template #expansion="slotProps">
        <div class="p-4">
          <div v-if="carregandoHistorico[slotProps.data.id]" class="flex justify-content-center p-4">
            <ProgressSpinner />
          </div>
          <div v-else-if="historicoPorSolicitacao[slotProps.data.id] && historicoPorSolicitacao[slotProps.data.id].length > 0">
            <h5 class="mb-3 text-900">Histórico da Solicitação</h5>
            <Timeline :value="historicoPorSolicitacao[slotProps.data.id]" class="p-timeline-vertical">
              <template #marker="slotPropsHistory">
                <span
                    class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-2"
                    :style="{ backgroundColor: getCorTipo(slotPropsHistory.item.tipo) }"
                >
                  <i :class="getIconeTipo(slotPropsHistory.item.tipo)"></i>
                </span>
              </template>
              <template #content="slotPropsHistory">
                <div class="flex flex-column">
                  <div class="flex align-items-center gap-2 mb-2">
                    <span class="font-semibold text-900">{{ slotPropsHistory.item.acao }}</span>
                    <Tag
                        :value="slotPropsHistory.item.status || slotPropsHistory.item.nivel_label"
                        :severity="getSeverityTipo(slotPropsHistory.item.tipo)"
                        :style="getStyleTipo(slotPropsHistory.item.tipo)"
                    />
                  </div>
                  <div class="text-600 mb-2">
                    <i class="pi pi-user mr-2"></i>
                    <span>{{ slotPropsHistory.item.usuario }}</span>
                  </div>
                  <div class="text-500 mb-2" v-if="slotPropsHistory.item.observacao">
                    <i class="pi pi-comment mr-2"></i>
                    <span>{{ slotPropsHistory.item.observacao }}</span>
                  </div>
                  <div class="text-500 text-sm">
                    <i class="pi pi-calendar mr-2"></i>
                    <span>{{ slotPropsHistory.item.data }}</span>
                  </div>
                </div>
              </template>
            </Timeline>
          </div>
          <div v-else class="text-center text-500 p-4">
            Nenhum histórico disponível para esta solicitação.
          </div>
        </div>
      </template>
    </DataTable>

    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import SolicitacaoService from '@/service/SolicitacaoService';
import PermissionsService from '@/service/PermissionsService';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import Timeline from 'primevue/timeline';
import ProgressSpinner from 'primevue/progressspinner';
import Toast from 'primevue/toast';

export default {
  name: 'SolicitacoesRelatorio',
  components: {
    DataTable,
    Column,
    Button,
    InputText,
    Tag,
    Timeline,
    ProgressSpinner,
    Toast,
  },
  setup() {
    const toast = useToast();
    const router = useRouter();
    const permissionService = new PermissionsService();

    // Verificar permissão ao montar o componente
    permissionService.hasPermissionsView('view_solicitacoes_relatorio');

    const solicitacoes = ref([]);
    const filtroGlobal = ref('');
    const totalRecords = ref(0);
    const page = ref(1);
    const rows = ref(10);
    const carregando = ref(false);
    const expandedRows = ref([]);
    const historicoPorSolicitacao = reactive({});
    const carregandoHistorico = reactive({});
    const sortField = ref(null);
    const sortOrder = ref(null);

    const podeVerTodas = computed(() => {
      return permissionService.hasPermissions('view_all_solicitacoes');
    });

    const mapaStatus = {
      aguardando: 'warning',
      autorizado: 'info',
      cotacao: 'warning',
      compra_em_andamento: 'info',
      finalizada: 'info',
      analisada: 'help',
      analisada_aguardando: 'help',
      analise_gerencia: 'info',
      aprovado: 'success',
    };

    const carregarSolicitacoes = async (resetarPagina = false) => {
      try {
        carregando.value = true;
        if (resetarPagina) page.value = 1;

        const params = { page: page.value, per_page: rows.value };
        if (!podeVerTodas.value) params.my_requests = 'true';
        if (filtroGlobal.value?.trim()) params.search = filtroGlobal.value.trim();

        const { data } = await SolicitacaoService.list(params);
        solicitacoes.value = (data?.data || []).map((item) => ({
          id: item.id,
          numero: item.numero,
          data: item.data,
          solicitante: item.solicitante,
          centroCusto: typeof item.centro_custo === 'string' ? item.centro_custo : item.centro_custo,
          frenteObra: item.frente_obra,
          status: item.status?.label,
          statusSlug: item.status?.slug,
        }));
        const pag = data?.pagination || {};
        totalRecords.value = pag.total ?? data?.total ?? solicitacoes.value.length;
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível carregar as solicitações.';
        toast.add({ severity: 'error', summary: 'Erro ao carregar', detail, life: 4000 });
      } finally {
        carregando.value = false;
      }
    };

    const onPage = (event) => {
      page.value = event.page + 1;
      rows.value = event.rows;
      carregarSolicitacoes();
    };

    const carregarHistorico = async (solicitacaoId) => {
      if (historicoPorSolicitacao[solicitacaoId]) {
        return; // Já carregado
      }

      try {
        carregandoHistorico[solicitacaoId] = true;
        const { data } = await SolicitacaoService.show(solicitacaoId);
        const historico = data?.data?.historico || [];
        historicoPorSolicitacao[solicitacaoId] = historico.map(item => ({
          ...item,
          key: `${item.tipo}-${item.timestamp || Date.now()}`,
        }));
      } catch (error) {
        console.error('Erro ao carregar histórico', error);
        historicoPorSolicitacao[solicitacaoId] = [];
      } finally {
        carregandoHistorico[solicitacaoId] = false;
      }
    };

    const onRowToggle = (event) => {
      // Handler para o evento, mas vamos usar watch também
    };

    // Observar mudanças em expandedRows para carregar histórico quando uma linha é expandida
    watch(expandedRows, (newRows) => {
      if (newRows && Array.isArray(newRows)) {
        newRows.forEach((row) => {
          if (row && row.id && !historicoPorSolicitacao[row.id]) {
            carregarHistorico(row.id);
          }
        });
      }
    }, { deep: true });

    const formatarCentroCusto = (centroCusto) => {
      if (!centroCusto) return '-';
      
      if (typeof centroCusto === 'string') {
        return centroCusto;
      }
      
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

    const statusStyle = (slug) => {
      const styles = {
        aguardando: { backgroundColor: '#FFEED0', color: '#C47F17' },
        autorizado: { backgroundColor: '#CDE7FF', color: '#1363B4' },
        cotacao: { backgroundColor: '#FFEED0', color: '#C47F17' },
        compra_em_andamento: { backgroundColor: '#CDE7FF', color: '#1363B4' },
        finalizada: { backgroundColor: '#E0D5FF', color: '#5E37B4' },
        analisada: { backgroundColor: '#BFF3E0', color: '#0F8558' },
        analisada_aguardando: { backgroundColor: '#F3F0C7', color: '#9C8A1F' },
        analise_gerencia: { backgroundColor: '#FAD7DF', color: '#B61643' },
        aprovado: { backgroundColor: '#CFF5D8', color: '#237A3F' },
      };

      return styles[slug] ?? { backgroundColor: '#E7E9EE', color: '#475569' };
    };

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

    const exportar = () => {
      toast.add({ severity: 'info', summary: 'Exportar', detail: 'Funcionalidade de exportação em desenvolvimento...', life: 2000 });
    };

    const onSort = (event) => {
      sortField.value = event.sortField;
      sortOrder.value = event.sortOrder;
    };

    onMounted(carregarSolicitacoes);

    return {
      solicitacoes,
      filtroGlobal,
      totalRecords,
      rows,
      onPage,
      carregando,
      expandedRows,
      historicoPorSolicitacao,
      carregandoHistorico,
      sortField,
      sortOrder,
      mapaStatus,
      statusStyle,
      formatarCentroCusto,
      onRowToggle,
      getCorTipo,
      getIconeTipo,
      getSeverityTipo,
      getStyleTipo,
      exportar,
      onSort,
    };
  },
};
</script>

<style scoped>
.card {
  border-radius: 10px;
  background: #fff;
}

:deep(.p-datatable) {
  border: none !important;
}

:deep(.p-tag-success) {
  background-color: #e7f8ec !important;
  color: #0f7c2f !important;
  border-radius: 10px;
  padding: 0.3rem 1rem;
}

:deep(.p-tag-info) {
  background-color: #e7f2fa !important;
  color: #0c60b9 !important;
  border-radius: 10px;
  padding: 0.3rem 1rem;
}

:deep(.p-tag-danger) {
  background-color: #fae7e7 !important;
  color: #c02424 !important;
  border-radius: 10px;
  padding: 0.3rem 1rem;
}

:deep(.p-datatable-expanded-row-content) {
  padding: 0 !important;
}
</style>

