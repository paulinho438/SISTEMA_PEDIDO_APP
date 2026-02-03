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
        <Button
          label="Exportar todos (sem filtro)"
          icon="pi pi-file-excel"
          class="p-button-outlined p-button-info"
          @click="exportarTodosExcel"
          :loading="exportandoTodos"
          :disabled="carregando"
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
        <div class="col-12 md:col-3 produto-select">
          <label class="block text-600 mb-2">Produto</label>
          <div class="p-inputgroup">
            <input
              type="text"
              :value="produtoExibicao"
              readonly
              placeholder="Código ou descrição do produto"
              class="p-inputtext p-component w-full"
              @click="abrirModalProdutos"
            />
            <Button
              v-if="produtoSelecionado"
              icon="pi pi-times"
              class="p-button-outlined"
              @click="limparProduto"
              type="button"
            />
            <Button
              icon="pi pi-chevron-down"
              class="p-button-outlined"
              @click="abrirModalProdutos"
              type="button"
            />
          </div>
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
      <Column field="solicitante" header="Solicitante" sortable style="min-width: 160px">
        <template #body="slotProps">
          <span class="text-wrap">{{ slotProps.data.solicitante ?? '-' }}</span>
        </template>
      </Column>
      <Column field="produto" header="Produto" sortable style="min-width: 200px">
        <template #body="slotProps">
          <span class="text-wrap">{{ slotProps.data.produto }}</span>
        </template>
      </Column>
      <Column field="unidade" header="Unidade" sortable style="width: 90px">
        <template #body="slotProps">
          {{ slotProps.data.unidade ?? '-' }}
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
          <td></td>
          <td></td>
          <td class="font-semibold text-900">{{ totalQtd }}</td>
          <td colspan="2"></td>
        </tr>
      </template>
    </DataTable>

    <!-- Modal Selecionar produto (apenas produtos com pelo menos uma solicitação) -->
    <Dialog
      v-model:visible="modalProdutos.visivel"
      modal
      header="Selecionar produto"
      :style="{ width: '60vw', maxWidth: '900px' }"
      appendTo="body"
    >
      <div class="mb-3">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText
            v-model="modalProdutos.busca"
            placeholder="Buscar (código, descrição...)"
            class="w-full"
            @input="onPesquisarProdutos"
          />
        </span>
      </div>

      <DataTable
        :value="modalProdutos.items"
        selectionMode="single"
        v-model:selection="modalProdutos.selection"
        :loading="modalProdutos.loading"
        dataKey="B1_COD"
        class="p-datatable-sm"
        paginator
        :rows="modalProdutos.perPage"
        :totalRecords="modalProdutos.total"
        :rowsPerPageOptions="[10, 20, 50]"
        lazy
        :first="(modalProdutos.page - 1) * modalProdutos.perPage"
        @page="onProdutosPage"
        responsiveLayout="scroll"
      >
        <Column selectionMode="single" headerStyle="width:3rem" />
        <Column field="B1_COD" header="Código" sortable />
        <Column field="B1_DESC" header="Descrição" sortable />
        <Column field="B1_UM" header="Unidade de medida" sortable />
      </DataTable>

      <template #footer>
        <div class="flex justify-content-end gap-2">
          <Button label="Cancelar" class="p-button-text" @click="fecharModalProdutos" />
          <Button
            label="Selecionar"
            class="p-button-success"
            @click="confirmarProduto"
            :disabled="!modalProdutos.selection"
          />
        </div>
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
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
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';

const toast = useToast();
const router = useRouter();
const store = useStore();

const dados = ref([]);
const dataInicial = ref(null);
const dataFinal = ref(null);
const empresaId = ref(null);
/** Produto selecionado no modal (apenas produtos com solicitação). Código enviado na busca = produtoSelecionado?.B1_COD */
const produtoSelecionado = ref(null);
const carregando = ref(false);
const exportando = ref(false);
const exportandoTodos = ref(false);

const modalProdutos = reactive({
  visivel: false,
  busca: '',
  selection: null,
  items: [],
  page: 1,
  perPage: 10,
  total: 0,
  loading: false,
});
let buscaProdutoTimeout = null;

const empresas = computed(() => store.getters.companies || store.getters.allCompanies || []);

/** Código do produto enviado na API (B1_COD do selecionado) */
const produto = computed({
  get: () => produtoSelecionado.value?.B1_COD ?? '',
  set: () => {},
});

const produtoExibicao = computed(() => {
  const p = produtoSelecionado.value;
  if (!p) return '';
  const desc = (p.B1_DESC || '').trim();
  return desc ? `${p.B1_COD} ${desc}` : (p.B1_COD || '');
});

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

const fetchProdutos = async () => {
  try {
    modalProdutos.loading = true;
    const params = {
      page: modalProdutos.page,
      per_page: modalProdutos.perPage,
    };
    const busca = modalProdutos.busca?.trim();
    if (busca) params.busca = busca;
    if (empresaId.value != null && empresaId.value !== '') {
      params.company_id = empresaId.value;
    }
    const { data } = await RelatorioService.produtosComSolicitacao(params);
    const payload = data ?? {};
    const list = payload?.data ?? [];
    modalProdutos.items = Array.isArray(list) ? list : [];
    const pag = payload?.pagination ?? {};
    modalProdutos.total = pag?.total ?? modalProdutos.items.length;
    modalProdutos.page = pag?.current_page ?? modalProdutos.page;
    modalProdutos.perPage = pag?.per_page ?? modalProdutos.perPage;
    if (modalProdutos.selection?.B1_COD) {
      const match = modalProdutos.items.find((item) => item.B1_COD === modalProdutos.selection.B1_COD);
      if (match) modalProdutos.selection = match;
    }
  } catch (error) {
    const detail = error?.response?.data?.message || 'Não foi possível carregar os produtos.';
    toast.add({ severity: 'error', summary: 'Erro ao carregar produtos', detail, life: 4000 });
    modalProdutos.items = [];
  } finally {
    modalProdutos.loading = false;
  }
};

const abrirModalProdutos = () => {
  modalProdutos.visivel = true;
  modalProdutos.page = 1;
  modalProdutos.selection = null;
  fetchProdutos();
};

const fecharModalProdutos = () => {
  modalProdutos.visivel = false;
};

const onPesquisarProdutos = () => {
  if (buscaProdutoTimeout) clearTimeout(buscaProdutoTimeout);
  buscaProdutoTimeout = setTimeout(() => {
    modalProdutos.page = 1;
    fetchProdutos();
  }, 400);
};

const onProdutosPage = (event) => {
  modalProdutos.page = event.page + 1;
  modalProdutos.perPage = event.rows;
  fetchProdutos();
};

const confirmarProduto = () => {
  const p = modalProdutos.selection;
  if (!p) return;
  produtoSelecionado.value = { B1_COD: p.B1_COD, B1_DESC: p.B1_DESC, B1_UM: p.B1_UM };
  modalProdutos.visivel = false;
  modalProdutos.selection = null;
};

const limparProduto = () => {
  produtoSelecionado.value = null;
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
  produtoSelecionado.value = null;
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
    const headers = ['Cotação', 'Data', 'Solicitante', 'Produto', 'Unidade', 'Qtd', 'Obs'];
    const sep = ';';
    const csvRows = [
      headers.join(sep),
      ...dados.value.map((r) =>
        [
          escapeCsv(r.numero),
          escapeCsv(r.data),
          escapeCsv(r.solicitante ?? '-'),
          escapeCsv(r.produto),
          escapeCsv(r.unidade ?? '-'),
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

const exportarTodosExcel = async () => {
  exportandoTodos.value = true;
  try {
    const { data } = await RelatorioService.solicitacaoProdutoTodos({});
    const lista = data?.data ?? [];
    const rows = Array.isArray(lista) ? lista : [];
    if (rows.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Sem dados',
        detail: 'Nenhum item em solicitação encontrado para exportar.',
        life: 3000,
      });
      return;
    }
    const headers = ['Cotação', 'Data', 'Solicitante', 'Produto', 'Unidade', 'Qtd', 'Obs'];
    const sep = ';';
    const csvRows = [
      headers.join(sep),
      ...rows.map((r) =>
        [
          escapeCsv(r.numero),
          escapeCsv(r.data),
          escapeCsv(r.solicitante ?? '-'),
          escapeCsv(r.produto),
          escapeCsv(r.unidade ?? '-'),
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
    link.setAttribute('download', `solicitacao_produto_todos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.add({
      severity: 'success',
      summary: 'Exportação concluída',
      detail: `Arquivo com ${rows.length} registro(s) baixado (todos os itens em solicitação). Abra no Excel.`,
      life: 4000,
    });
  } catch (e) {
    const detail = e?.response?.data?.message || 'Não foi possível gerar o arquivo.';
    toast.add({
      severity: 'error',
      summary: 'Erro ao exportar',
      detail,
      life: 4000,
    });
  } finally {
    exportandoTodos.value = false;
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

.filters .produto-select input[readonly] {
  cursor: pointer;
}

.filters .p-inputgroup .p-inputtext {
  flex: 1 1 auto;
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
