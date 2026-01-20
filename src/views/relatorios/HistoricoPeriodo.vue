<template>
  <div class="card relatorio-container">
    <div class="mb-4 flex justify-content-between align-items-center flex-wrap gap-3">
      <div>
        <h4 class="m-0 text-900">Histórico por Período</h4>
        <p class="m-0 text-600">
          Evolução diária das cotações por status.
        </p>
      </div>
      <div class="flex gap-2 align-items-center filters-actions">
        <Button
          label="Exportar"
          icon="pi pi-upload"
          class="p-button-outlined"
          @click="exportar"
          :disabled="historico.length === 0"
        />
      </div>
    </div>

    <div class="filters mb-4">
      <div class="grid">
        <div class="col-12 md:col-4">
          <label class="block text-600 mb-2">Período</label>
          <Calendar
            v-model="periodo"
            selectionMode="range"
            dateFormat="dd/mm/yy"
            showIcon
            :manualInput="false"
            placeholder="Selecione um período"
            class="w-full"
          />
        </div>

        <div class="col-12 md:col-4">
          <label class="block text-600 mb-2">Status</label>
          <MultiSelect
            v-model="statusSelecionados"
            :options="statusDisponiveis"
            optionLabel="label"
            optionValue="slug"
            placeholder="Selecione os status"
            class="w-full"
            :filter="true"
            display="chip"
          />
        </div>

        <div class="col-12 md:col-4 flex align-items-end gap-2">
          <Button
            label="Aplicar filtros"
            icon="pi pi-filter"
            class="p-button-success w-full md:w-auto"
            :loading="carregando"
            @click="carregarDados"
          />
          <Button
            label="Limpar"
            icon="pi pi-times"
            class="p-button-secondary w-full md:w-auto"
            :disabled="carregando"
            @click="limparFiltros"
          />
        </div>
      </div>
    </div>

    <DataTable
      :value="historico"
      :loading="carregando"
      dataKey="data"
      responsiveLayout="scroll"
      class="p-datatable-sm tabela-relatorio"
    >
      <template #empty>
        <div class="text-center text-600 py-4">
          Nenhum registro encontrado para os filtros selecionados.
        </div>
      </template>

      <Column field="data" header="Data" sortable>
        <template #body="slotProps">
          {{ formatarData(slotProps.data.data) }}
        </template>
      </Column>

      <Column field="total" header="Total" sortable />

      <Column header="Detalhamento">
        <template #body="slotProps">
          <div class="flex gap-2 flex-wrap">
            <div
              v-for="status in slotProps.data.status"
              :key="status.status"
              class="badge-status"
            >
              <span class="font-semibold">{{ status.label }}</span>
              <small>{{ status.total }}</small>
            </div>
          </div>
        </template>
      </Column>
    </DataTable>

    <div class="mt-4">
      <h5 class="text-900 mb-3">Totais por status</h5>
      <div class="flex gap-3 flex-wrap">
        <div
          v-for="status in serieTotal"
          :key="status.status"
          class="card badge-resumo"
        >
          <span class="text-600">{{ status.label }}</span>
          <span class="text-900 font-semibold text-xl">{{ status.total }}</span>
        </div>
      </div>
    </div>

    <Toast />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import RelatorioService from '@/service/RelatorioService';
import Calendar from 'primevue/calendar';
import MultiSelect from 'primevue/multiselect';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Toast from 'primevue/toast';

const toast = useToast();

const historico = ref([]);
const serieTotal = ref([]);
const statusDisponiveis = ref([]);
const statusSelecionados = ref([]);
const periodo = ref(null);
const carregando = ref(false);

const formatarData = (data) => {
  return new Date(data).toLocaleDateString('pt-BR');
};

const montarParametros = () => {
  const params = {};

  if (statusSelecionados.value.length) {
    params.status = statusSelecionados.value.join(',');
  }

  const range = periodo.value ?? [];
  if (Array.isArray(range) && range.length) {
    const [inicio, fim] = range;

    if (inicio instanceof Date) {
      // Usar métodos locais para evitar problemas de timezone
      const ano = inicio.getFullYear();
      const mes = String(inicio.getMonth() + 1).padStart(2, '0');
      const dia = String(inicio.getDate()).padStart(2, '0');
      params.start_date = `${ano}-${mes}-${dia}`;
    } else if (typeof inicio === 'string' && inicio) {
      params.start_date = inicio.split('T')[0] ?? inicio;
    }

    if (fim instanceof Date) {
      // Usar métodos locais para evitar problemas de timezone
      const ano = fim.getFullYear();
      const mes = String(fim.getMonth() + 1).padStart(2, '0');
      const dia = String(fim.getDate()).padStart(2, '0');
      params.end_date = `${ano}-${mes}-${dia}`;
    } else if (typeof fim === 'string' && fim) {
      params.end_date = fim.split('T')[0] ?? fim;
    }
  }

  return params;
};

const carregarDados = async () => {
  try {
    carregando.value = true;
    const { data } = await RelatorioService.historicoPorPeriodo(montarParametros());

    historico.value = data?.data ?? [];
    statusDisponiveis.value = data?.meta?.statuses ?? [];
    serieTotal.value = data?.meta?.serie_total ?? [];

    if (!statusSelecionados.value.length && statusDisponiveis.value.length) {
      statusSelecionados.value = statusDisponiveis.value.map((status) => status.slug);
    }
  } catch (error) {
    const detail =
      error?.response?.data?.message || 'Não foi possível carregar o relatório neste momento.';

    toast.add({
      severity: 'error',
      summary: 'Falha ao carregar relatório',
      detail,
      life: 4000,
    });
  } finally {
    carregando.value = false;
  }
};

const limparFiltros = () => {
  periodo.value = null;
  statusSelecionados.value = [];
  carregarDados();
};

const exportar = () => {
  toast.add({
    severity: 'info',
    summary: 'Exportação',
    detail: 'Funcionalidade de exportação ainda não implementada.',
    life: 3000,
  });
};

onMounted(carregarDados);
</script>

<style scoped>
.relatorio-container {
  padding: 2.5rem;
}

.filters .p-calendar,
.filters :deep(.p-multiselect) {
  width: 100%;
}

.tabela-relatorio :deep(.p-datatable-thead > tr > th) {
  background-color: #f1f5f9;
  color: #0f172a;
  font-weight: 600;
}

.badge-status {
  background: #eef2ff;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 140px;
}

.badge-resumo {
  padding: 1rem 1.5rem;
  border-radius: 12px;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 160px;
}

@media screen and (max-width: 768px) {
  .relatorio-container {
    padding: 1.25rem;
  }

  .filters-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>

