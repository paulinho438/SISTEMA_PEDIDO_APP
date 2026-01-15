<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import DashboardService from '@/service/DashboardService';
import { useLayout } from '@/layout/composables/layout';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

const { isDarkTheme } = useLayout();
const toast = useToast();
const dashboardService = new DashboardService();

const processos = ref([]);
const monthlyColumns = ref([]);
const filtroGlobal = ref('');
const loading = ref(false);
const statusSolicitacoes = ref([]);
const statusResumo = ref([]);

const lineData = reactive({
  labels: [],
  datasets: [],
});

const lineOptions = ref(null);

const processosFiltrados = computed(() => {
  if (!filtroGlobal.value) {
    return processos.value;
  }

  const termo = filtroGlobal.value.toLowerCase();

  return processos.value.filter((item) =>
    (item.comprador ?? '').toLowerCase().includes(termo),
  );
});

const formatDecimal = (value, fractionDigits = 2) => {
  const numero = Number(value ?? 0);

  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
};

const aplicarTema = () => {
  const color = isDarkTheme.value ? '#ebedef' : '#495057';
  const gridColor = isDarkTheme.value ? 'rgba(160,167,181,.3)' : '#ebedef';

  lineOptions.value = {
    plugins: { legend: { labels: { color } } },
    scales: {
      x: { ticks: { color }, grid: { color: gridColor } },
      y: { ticks: { color }, grid: { color: gridColor } },
    },
  };
};

const carregarDados = async () => {
  try {
    loading.value = true;
    const { data } = await dashboardService.getPurchaseMetrics();

    processos.value = data?.processos ?? [];
    monthlyColumns.value = data?.meta?.monthly_columns ?? [];
    statusSolicitacoes.value = data?.status_por_comprador ?? [];
    statusResumo.value = data?.status_resumo ?? [];

    const dataset = data?.media_mensal ?? {};
    lineData.labels = dataset.labels ?? [];
    lineData.datasets = [
      {
        label: 'Processos finalizados',
        data: dataset.values ?? [],
        fill: true,
        backgroundColor: 'rgba(0, 187, 126, 0.2)',
        borderColor: '#00bb7e',
        tension: 0.3,
      },
    ];
  } catch (error) {
    const detail =
      error?.response?.data?.message ?? 'Não foi possível carregar os indicadores.';

    toast.add({
      severity: 'error',
      summary: 'Erro ao carregar painel',
      detail,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  aplicarTema();
  carregarDados();
});

watch(isDarkTheme, aplicarTema);
</script>

<template>
  <div class="grid">
    <!-- COLUNA PRINCIPAL -->
    <div class="col-12 xl:col-12">
      <div class="card">
        <div class="flex justify-between items-center mb-4" style="justify-content: space-between;">
          <h5 class="text-lg font-bold">Processos finalizados</h5>
          <span class="p-input-icon-left">
            <i class="pi pi-search"/>
            <InputText v-model="filtroGlobal" placeholder="Buscar comprador..." class="w-64"/>
          </span>
        </div>

        <DataTable
            :value="processosFiltrados"
            :loading="loading"
            class="tabela-processos"
            dataKey="comprador"
            paginator
            :rows="10"
            responsiveLayout="scroll"
        >
          <Column field="comprador" header="Comprador" sortable></Column>
          <Column field="acumulado" header="Acumulado" sortable></Column>
          <Column field="semana_anterior" header="Semana anterior" sortable></Column>
          <Column field="semana_atual" header="Semana atual" sortable></Column>

          <Column v-for="dia in ['Seg','Ter','Qua','Qui','Sex','Sab','Dom']" :key="dia" :header="dia"
                  :field="dia.toLowerCase()" sortable/>

          <Column field="media_semana_atual" header="Média semana atual" sortable>
            <template #body="slotProps">
              {{ formatDecimal(slotProps.data.media_semana_atual) }}
            </template>
          </Column>
          <Column field="media_semana_anterior" header="Média semana anterior" sortable>
            <template #body="slotProps">
              {{ formatDecimal(slotProps.data.media_semana_anterior) }}
            </template>
          </Column>

          <Column
              v-for="col in monthlyColumns"
              :key="col.key"
              :field="col.key"
              :header="`Média ${col.label}`"
              sortable
          >
            <template #body="slotProps">
              {{ formatDecimal(slotProps.data[col.key]) }}
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- NOVA LINHA DE DASHBOARD -->
    <div class="col-12 xl:col-6">
      <div class="card">
        <h5 class="text-lg font-bold mb-4">Status solicitações</h5>

        <DataTable
            :value="statusSolicitacoes"
            :paginator="true"
            :rows="5"
            responsiveLayout="scroll"
        >
          <Column field="comprador" header="Comprador" sortable></Column>
          <Column field="aguardando" header="Aguardando" sortable></Column>
          <Column field="cotacao" header="Cotação" sortable></Column>
          <Column field="total" header="Total" sortable></Column>
          <Column field="percentual" header="% ↑↓" sortable>
            <template #body="slotProps">
              <span class="text-green-600 font-semibold">
                {{ formatDecimal(slotProps.data.percentual) }}%
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <div class="col-12 xl:col-6">
      <div class="card">
        <h5 class="text-lg font-bold mb-4">Status</h5>

        <DataTable
            :value="statusResumo"
            :paginator="true"
            :rows="5"
            responsiveLayout="scroll"
        >
          <Column field="status" header="Status" sortable></Column>
          <Column field="quantidade" header="Quantidade" sortable></Column>
          <Column field="percentual" header="% ↑↓" sortable>
            <template #body="slotProps">
              <span class="text-green-600 font-semibold">
                {{ formatDecimal(slotProps.data.percentual) }}%
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

  </div>
  <Toast />
</template>

<style scoped>
.card {
  background-color: var(--surface-card);
  border-radius: 10px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.1);
}

/* Estilo apenas para a tabela de processos */
::v-deep(.tabela-processos .p-datatable-thead > tr > th) {
  background-color: #e9f9f0 !important; /* verde claro */
  color: #2b4a3d !important;            /* texto verde escuro */
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  border-bottom: 1px solid #cde8d3 !important;
}

/* Garante que toda a linha do cabeçalho fique verde */
::v-deep(.tabela-processos .p-datatable-thead > tr) {
  background-color: #e9f9f0 !important;
}

/* Arredonda bordas superiores */
::v-deep(.tabela-processos .p-datatable-thead) {
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}

/* Melhora contraste no modo escuro */
:deep(.dark-theme) .tabela-processos .p-datatable-thead > tr > th {
  background-color: #2e4b3a !important;
  color: #e0f5e9 !important;
}

/* Estilo para cabeçalhos das tabelas inferiores */
::v-deep(.p-datatable-thead > tr > th) {
  background-color: #f9fbfc !important;
  font-weight: 600;
  color: #2b4a3d;
  border: none;
  border-bottom: 1px solid #e0e7e2 !important;
}

/* Cor verde nos percentuais */
.text-green-600 {
  color: #16a34a !important;
}
</style>
