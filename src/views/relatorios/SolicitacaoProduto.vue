<template>
  <div class="card relatorio-container">
    <div class="mb-4 flex justify-content-between align-items-center flex-wrap gap-3">
      <div>
        <h4 class="m-0 text-900">Solicitação / Produto</h4>
        <p class="m-0 text-600">
          Consulte todas as solicitações que contêm um produto no período. Filtre por produto e empresa.
        </p>
      </div>
      <div class="flex gap-2 align-items-center filters-actions">
        <Button
          label="Exportar em Excel"
          icon="pi pi-file-excel"
          class="p-button-outlined p-button-success"
          @click="exportarExcel"
          :loading="exportando"
          :disabled="carregando || dados.length === 0"
        />
      </div>
    </div>

    <div class="filters mb-4">
      <div class="grid">
        <div class="col-12 md:col-3">
          <label class="block text-600 mb-2">Data Inicial</label>
          <Calendar
            v-model="dataInicial"
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Data inicial"
            class="w-full"
          />
        </div>
        <div class="col-12 md:col-3">
          <label class="block text-600 mb-2">Data Final</label>
          <Calendar
            v-model="dataFinal"
            dateFormat="dd/mm/yy"
            showIcon
            placeholder="Data final"
            class="w-full"
          />
        </div>
        <div class="col-12 md:col-3">
          <label class="block text-600 mb-2">Empresa</label>
          <Dropdown
            v-model="empresaId"
            :options="empresas"
            optionLabel="company"
            optionValue="id"
            placeholder="Todas"
            class="w-full"
            showClear
          />
        </div>
        <div class="col-12 md:col-3">
          <label class="block text-600 mb-2">Produto</label>
          <InputText
            v-model="produto"
            placeholder="Código ou descrição do produto"
            class="w-full"
            @keyup.enter="buscar"
          />
        </div>
        <div class="col-12 flex align-items-end gap-2">
          <Button
            label="Buscar"
            icon="pi pi-search"
            class="p-button-success"
            :loading="carregando"
            @click="buscar"
          />
          <Button
            label="Limpar"
            icon="pi pi-times"
            class="p-button-secondary"
            :disabled="carregando"
            @click="limparFiltros"
          />
        </div>
      </div>
    </div>

    <DataTable
      :value="dadosComChave"
      :loading="carregando"
      dataKey="rowKey"
      responsiveLayout="scroll"
      class="p-datatable-sm tabela-relatorio"
    >
      <template #empty>
        <div class="text-center text-600 py-4">
          Nenhuma solicitação encontrada para os filtros selecionados. Informe o período e o produto e clique em Buscar.
        </div>
      </template>

      <Column field="numero" header="Cotação" sortable />
      <Column field="data" header="Data" sortable />
      <Column field="produto" header="Produto" sortable style="min-width: 200px">
        <template #body="slotProps">
          <span class="text-wrap">{{ slotProps.data.produto }}</span>
        </template>
      </Column>
      <Column field="qtd" header="Qtd" sortable style="width: 80px" />
      <Column field="obs" header="Obs" style="min-width: 180px">
        <template #body="slotProps">
          <span class="text-wrap text-600">{{ slotProps.data.obs || '-' }}</span>
        </template>
      </Column>
      <Column header="Exibir" style="width: 100px">
        <template #body="slotProps">
          <Button
            label="Exibir"
            icon="pi pi-eye"
            class="p-button-sm p-button-outlined"
            @click="abrirSolicitacao(slotProps.data)"
          />
        </template>
      </Column>
      <template #footer>
        <tr>
          <td colspan="2" class="text-right font-semibold text-900">Total:</td>
          <td></td>
          <td class="font-semibold text-900">{{ totalQtd }}</td>
          <td colspan="2"></td>
        </tr>
      </template>
    </DataTable>

    <Toast />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { useToast } from 'primevue/usetoast';
import RelatorioService from '@/service/RelatorioService';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Toast from 'primevue/toast';

const toast = useToast();
const router = useRouter();
const store = useStore();

const dados = ref([]);
const dataInicial = ref(null);
const dataFinal = ref(null);
const empresaId = ref(null);
const produto = ref('');
const carregando = ref(false);
const exportando = ref(false);

const empresas = computed(() => store.getters.companies || store.getters.allCompanies || []);

const dadosComChave = computed(() =>
  dados.value.map((row, index) => ({
    ...row,
    rowKey: `${row.cotacao_id}-${row.produto}-${index}`,
  }))
);

const totalQtd = computed(() => dados.value.reduce((sum, row) => sum + (row.qtd ?? 0), 0));

const montarParametros = () => {
  const params = {};

  if (dataInicial.value instanceof Date) {
    params.start_date = dataInicial.value.toISOString().substring(0, 10);
  } else if (typeof dataInicial.value === 'string' && dataInicial.value) {
    params.start_date = dataInicial.value.split('T')[0] ?? dataInicial.value;
  }

  if (dataFinal.value instanceof Date) {
    params.end_date = dataFinal.value.toISOString().substring(0, 10);
  } else if (typeof dataFinal.value === 'string' && dataFinal.value) {
    params.end_date = dataFinal.value.split('T')[0] ?? dataFinal.value;
  }

  if (empresaId.value != null && empresaId.value !== '') {
    params.company_id = empresaId.value;
  }

  if (produto.value?.trim()) {
    params.product = produto.value.trim();
  }

  return params;
};

const buscar = async () => {
  try {
    carregando.value = true;
    const { data } = await RelatorioService.solicitacaoProduto(montarParametros());
    const raw = data?.data ?? [];
    dados.value = Array.isArray(raw) ? raw : [];
  } catch (error) {
    const detail =
      error?.response?.data?.message || 'Não foi possível carregar o relatório.';
    toast.add({
      severity: 'error',
      summary: 'Falha ao buscar',
      detail,
      life: 4000,
    });
    dados.value = [];
  } finally {
    carregando.value = false;
  }
};

const limparFiltros = () => {
  dataInicial.value = null;
  dataFinal.value = null;
  empresaId.value = null;
  produto.value = '';
  dados.value = [];
};

const abrirSolicitacao = (row) => {
  if (row?.cotacao_id) {
    router.push({ name: 'novaCotacao', params: { id: String(row.cotacao_id) } });
  }
};

const escapeCsv = (val) => {
  if (val == null) return '';
  const s = String(val).trim();
  if (s.includes(';') || s.includes('"') || s.includes('\n') || s.includes(',')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
};

const exportarExcel = () => {
  if (dados.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Sem dados',
      detail: 'Nenhum registro para exportar.',
      life: 3000,
    });
    return;
  }
  exportando.value = true;
  try {
    const headers = ['Cotação', 'Data', 'Produto', 'Qtd', 'Obs'];
    const sep = ';';
    const csvRows = [
      headers.join(sep),
      ...dados.value.map((r) =>
        [
          escapeCsv(r.numero),
          escapeCsv(r.data),
          escapeCsv(r.produto),
          escapeCsv(r.qtd),
          escapeCsv(r.obs),
        ].join(sep)
      ),
    ];
    const csvContent = csvRows.join('\r\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `solicitacao_produto_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.add({
      severity: 'success',
      summary: 'Exportação concluída',
      detail: `Arquivo com ${dados.value.length} registro(s) baixado. Abra no Excel.`,
      life: 4000,
    });
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Erro ao exportar',
      detail: 'Não foi possível gerar o arquivo.',
      life: 4000,
    });
  } finally {
    exportando.value = false;
  }
};

onMounted(() => {
  // Não carregar automaticamente; usuário deve informar período e produto
});
</script>

<style scoped>
.relatorio-container {
  padding: 2.5rem;
}

.filters .p-calendar,
.filters :deep(.p-dropdown),
.filters :deep(.p-inputtext) {
  width: 100%;
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
