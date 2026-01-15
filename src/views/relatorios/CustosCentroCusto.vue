<template>
  <div class="card relatorio-container">
    <div class="mb-4 flex justify-content-between align-items-center flex-wrap gap-3">
      <div>
        <h4 class="m-0 text-900">Custos por Centro de Custo</h4>
        <p class="m-0 text-600">Acompanhe o valor consolidado das cotações por centro de custo.</p>
      </div>
      <div class="flex gap-2 align-items-center filters-actions">
        <Button
          label="Exportar"
          icon="pi pi-upload"
          class="p-button-outlined"
          @click="exportar"
          :disabled="dados.length === 0"
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
      :value="dados"
      :loading="carregando"
      dataKey="id"
      responsiveLayout="scroll"
      :expandedRows="linhasExpandidas"
      @row-expand="onRowExpand"
      @row-collapse="onRowCollapse"
      class="p-datatable-sm tabela-relatorio"
    >
      <template #empty>
        <div class="text-center text-600 py-4">
          Nenhum dado encontrado para os filtros selecionados.
        </div>
      </template>

      <Column type="expander" style="width: 3rem" />

      <Column field="codigo" header="Centro de Custo" sortable>
        <template #body="slotProps">
          <div class="flex flex-column">
            <span class="font-semibold text-900">
              {{ slotProps.data.codigo ?? 'Sem código' }}
            </span>
            <small class="text-600">
              {{ slotProps.data.descricao ?? 'Sem descrição' }}
            </small>
          </div>
        </template>
      </Column>

      <Column field="total_cotacoes" header="Qtd. Cotações" sortable>
        <template #body="slotProps">
          {{ slotProps.data.total_cotacoes }}
        </template>
        <template #footer>
          <span class="font-semibold text-900">
            {{ totais.totalCotacoes }}
          </span>
        </template>
      </Column>

      <Column field="total_itens" header="Qtd. Itens" sortable>
        <template #body="slotProps">
          {{ slotProps.data.total_itens }}
        </template>
        <template #footer>
          <span class="font-semibold text-900">
            {{ totais.totalItens }}
          </span>
        </template>
      </Column>

      <Column field="valor_total" header="Valor Total" sortable>
        <template #body="slotProps">
          {{ slotProps.data.valor_total_formatado }}
        </template>
        <template #footer>
          <span class="font-semibold text-900">
            {{ totais.valorTotalFormatado }}
          </span>
        </template>
      </Column>

      <template #expansion="slotProps">
        <div class="expansion-container">
          <h5 class="text-900 mb-3">Detalhamento por status</h5>
          <DataTable
            :value="slotProps.data.status_breakdown"
            responsiveLayout="scroll"
            class="p-datatable-sm"
          >
            <template #empty>
              <div class="text-center text-600 py-3">
                Nenhum dado detalhado para este centro de custo.
              </div>
            </template>

            <Column field="label" header="Status" />
            <Column field="total_cotacoes" header="Qtd. Cotações" />
            <Column field="total_itens" header="Qtd. Itens" />
            <Column field="valor_formatado" header="Valor" />
          </DataTable>
        </div>
      </template>
    </DataTable>

    <Toast />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useToast } from 'primevue/usetoast';
import RelatorioService from '@/service/RelatorioService';
import Calendar from 'primevue/calendar';
import MultiSelect from 'primevue/multiselect';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Toast from 'primevue/toast';

const toast = useToast();

const dados = ref([]);
const statusDisponiveis = ref([]);
const statusSelecionados = ref([]);
const periodo = ref(null);
const carregando = ref(false);
const linhasExpandidas = ref({});

const totais = computed(() => {
  const totalCotacoes = dados.value.reduce((sum, item) => sum + (item.total_cotacoes ?? 0), 0);
  const totalItens = dados.value.reduce((sum, item) => sum + (item.total_itens ?? 0), 0);
  const valorTotal = dados.value.reduce((sum, item) => sum + (item.valor_total ?? 0), 0);

  return {
    totalCotacoes,
    totalItens,
    valorTotal,
    valorTotalFormatado: formatarMoeda(valorTotal),
  };
});

const formatarMoeda = (valor) => {
  return Number(valor ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
};

const montarParametros = () => {
  const params = {};

  const range = periodo.value ?? [];
  if (Array.isArray(range) && range.length) {
    const [inicio, fim] = range;

    if (inicio instanceof Date) {
      params.start_date = inicio.toISOString().substring(0, 10);
    } else if (typeof inicio === 'string' && inicio) {
      params.start_date = inicio.split('T')[0] ?? inicio;
    }

    if (fim instanceof Date) {
      params.end_date = fim.toISOString().substring(0, 10);
    } else if (typeof fim === 'string' && fim) {
      params.end_date = fim.split('T')[0] ?? fim;
    }
  }

  if (statusSelecionados.value.length) {
    params.status = statusSelecionados.value.join(',');
  }

  return params;
};

const carregarDados = async () => {
  try {
    carregando.value = true;
    const { data } = await RelatorioService.custosPorCentroCusto(montarParametros());

    dados.value = data?.data ?? [];
    statusDisponiveis.value = data?.meta?.statuses ?? [];

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
  linhasExpandidas.value = {};
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

const onRowExpand = (event) => {
  linhasExpandidas.value = {
    ...linhasExpandidas.value,
    [event.data.id]: true,
  };
};

const onRowCollapse = (event) => {
  const { [event.data.id]: omit, ...rest } = linhasExpandidas.value;
  linhasExpandidas.value = rest;
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

.expansion-container {
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.tabela-relatorio :deep(.p-datatable-thead > tr > th) {
  background-color: #f1f5f9;
  color: #0f172a;
  font-weight: 600;
}

.tabela-relatorio :deep(.p-datatable-tfoot > tr > td) {
  background-color: #f8fafc;
  font-weight: 600;
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

