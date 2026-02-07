<template>
  <div class="card p-5 bg-page">
    <!-- Cabeçalho -->
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Pedidos de Compra</h5>
      <Button label="Exportar" icon="pi pi-upload" class="p-button-outlined" @click="exportar" />
    </div>

    <!-- Filtros -->
    <div class="flex flex-wrap align-items-end gap-2 mb-3">
      <span class="p-input-icon-left">
        <i class="pi pi-search" />
        <InputText
          v-model="filtroGlobal"
          placeholder="Buscar por número, fornecedor, cotação..."
          class="p-inputtext-sm"
          style="width: 20rem"
          @keyup.enter="() => carregar(true)"
        />
      </span>
      <div class="flex flex-column gap-1">
        <label class="text-sm text-500">Status</label>
        <Dropdown
          v-model="filtroStatus"
          :options="opcoesStatus"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos"
          class="w-10rem"
          :showClear="true"
        />
      </div>
      <Button label="Buscar" icon="pi pi-search" class="p-button-outlined" @click="() => carregar(true)" />
    </div>

    <!-- Tabela -->
    <DataTable
      :value="pedidos"
      :paginator="true"
      :rows="rows"
      :totalRecords="totalRecords"
      :lazy="true"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm tabela-pedidos"
      :loading="carregando"
      @page="onPage"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} pedidos"
      :rowsPerPageOptions="[10, 20, 50, 100]"
    >
      <Column field="order_number" header="Nº Pedido" sortable></Column>
      <Column field="order_date" header="Data" sortable>
        <template #body="slotProps">
          {{ formatarData(slotProps.data.order_date) }}
        </template>
      </Column>
      <Column field="quote.quote_number" header="Nº Cotação" sortable>
        <template #body="slotProps">
          {{ slotProps.data.quote?.quote_number || '-' }}
        </template>
      </Column>
      <Column field="supplier_name" header="Fornecedor" sortable></Column>
      <Column field="total_amount" header="Valor Total" sortable>
        <template #body="slotProps">
          {{ formatarValor(slotProps.data.total_amount) }}
        </template>
      </Column>
      <Column field="status" header="Status" sortable>
        <template #body="slotProps">
          <div class="flex align-items-center gap-2">
            <Tag
              :value="getLabelStatus(slotProps.data.status)"
              :severity="getCorStatus(slotProps.data.status)"
            />
            <i
              v-if="slotProps.data.status === 'link'"
              class="pi pi-clock text-orange-500"
              v-tooltip.top="'Aguardando aprovação/reprovação no Protheus'"
            />
          </div>
        </template>
      </Column>
      <Column header="Ações">
        <template #body="slotProps">
          <Button
            icon="pi pi-eye"
            class="p-button-rounded p-button-text p-button-info"
            @click="visualizar(slotProps.data)"
            v-tooltip.top="'Visualizar detalhes'"
          />
        </template>
      </Column>
    </DataTable>

    <Toast />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import PurchaseOrderService from '@/service/PurchaseOrderService';
import { usePaginationPersist } from '@/composables/usePaginationPersist';

const opcoesStatus = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'link', label: 'Aguardando LINK' },
  { value: 'link_aprovado', label: 'LINK Aprovado' },
  { value: 'link_reprovado', label: 'LINK Reprovado' },
  { value: 'coleta', label: 'Coleta' },
  { value: 'em_transito', label: 'Em Trânsito' },
  { value: 'atendido', label: 'Atendido' },
  { value: 'atendido_parcial', label: 'Atendido Parcial' },
  { value: 'pagamento', label: 'Pagamento' },
  { value: 'encerrado', label: 'Encerrado' },
  { value: 'recebido', label: 'Recebido' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default {
  name: 'PedidosCompraList',
  setup() {
    const toast = useToast();
    const router = useRouter();
    const { getInitialPagination, savePagination } = usePaginationPersist('pedidos-compra', 10);
    const saved = getInitialPagination();

    const pedidos = ref([]);
    const filtroGlobal = ref('');
    const filtroStatus = ref(null);
    const carregando = ref(false);
    const totalRecords = ref(0);
    const page = ref(saved.page);
    const rows = ref(saved.rows);
    const service = new PurchaseOrderService();

    const carregar = async (resetarPagina = false) => {
      try {
        carregando.value = true;
        if (resetarPagina) page.value = 1;

        const params = { page: page.value, per_page: rows.value };
        if (filtroGlobal.value?.trim()) params.search = filtroGlobal.value.trim();

        const { data } = await service.getAll(params);
        pedidos.value = data?.data || [];
        const pag = data?.pagination || {};
        totalRecords.value = pag.total ?? data?.total ?? pedidos.value.length;
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível carregar os pedidos de compra.';
        toast.add({ severity: 'error', summary: 'Erro ao carregar', detail, life: 4000 });
      } finally {
        carregando.value = false;
      }
    };

    const onPage = (event) => {
      const newPage = event.page + 1;
      const newRows = event.rows;
      savePagination(newRows, newPage);
      page.value = newPage;
      rows.value = newRows;
      carregar();
    };

    onMounted(() => carregar());

    const formatarValor = (valor) => {
      return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    };

    const formatarData = (data) => {
      if (!data) return '-';
      const date = new Date(data);
      return date.toLocaleDateString('pt-BR');
    };

    const getLabelStatus = (status) => {
      const statusMap = {
        pendente: 'Pendente',
        link: 'Aguardando LINK',
        link_aprovado: 'LINK Aprovado',
        link_reprovado: 'LINK Reprovado',
        coleta: 'Coleta',
        em_transito: 'Em Trânsito',
        atendido: 'Atendido',
        atendido_parcial: 'Atendido Parcial',
        pagamento: 'Pagamento',
        encerrado: 'Encerrado',
        recebido: 'Recebido',
        parcial: 'Parcial',
        cancelado: 'Cancelado',
      };
      return statusMap[status] || status || '-';
    };

    const getCorStatus = (status) => {
      const corMap = {
        pendente: 'warning',
        link: 'warning',
        link_aprovado: 'success',
        link_reprovado: 'danger',
        coleta: 'info',
        em_transito: 'info',
        atendido: 'success',
        atendido_parcial: 'warning',
        pagamento: 'info',
        encerrado: 'success',
        recebido: 'success',
        parcial: 'info',
        cancelado: 'danger',
      };
      return corMap[status] || 'secondary';
    };

    const visualizar = (pedido) => {
      router.push({ name: 'pedidoCompraDetalhes', params: { id: pedido.id } });
    };

    const exportar = () => {
      toast.add({
        severity: 'info',
        summary: 'Exportação',
        detail: 'Funcionalidade em desenvolvimento',
        life: 2500,
      });
    };

    return {
      pedidos,
      filtroGlobal,
      filtroStatus,
      opcoesStatus,
      totalRecords,
      rows,
      onPage,
      visualizar,
      exportar,
      formatarValor,
      formatarData,
      getLabelStatus,
      getCorStatus,
      carregando,
      carregar,
    };
  },
};
</script>

<style scoped>
.bg-page {
  background-color: #f6f9fb;
}

.tabela-pedidos :deep(.p-datatable-thead > tr > th) {
  background-color: #f9fafb;
  color: #333;
  font-weight: 600;
  border: none;
  border-bottom: 1px solid #eaeaea;
}

.tabela-pedidos :deep(.p-datatable-tbody > tr > td) {
  border: none;
  border-bottom: 1px solid #f0f0f0;
  color: #444;
}

.tabela-pedidos :deep(.p-datatable-tbody > tr:hover > td) {
  background-color: #f7fafa;
}

:deep(.p-button-info.p-button-text) {
  color: #1e90ff !important;
}

:deep(.p-paginator-bottom) {
  border-top: none !important;
  background: transparent !important;
}
</style>

