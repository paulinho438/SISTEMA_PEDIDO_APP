<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 m-0">Controle de Notas Fiscais</h5>
    </div>

    <div class="grid mb-3">
      <div class="col-12 md:col-3">
        <label for="numeroNota">Número da Nota</label>
        <InputText id="numeroNota" v-model="filtros.invoice_number" class="w-full" placeholder="Buscar por número" />
      </div>
      <div class="col-12 md:col-3">
        <label for="fornecedor">Fornecedor</label>
        <InputText id="fornecedor" v-model="filtros.supplier_name" class="w-full" placeholder="Buscar por fornecedor" />
      </div>
      <div class="col-12 md:col-3">
        <label for="dataDe">Data De</label>
        <Calendar id="dataDe" v-model="filtros.date_from" dateFormat="dd/mm/yy" class="w-full" showClear />
      </div>
      <div class="col-12 md:col-3">
        <label for="dataAte">Data Até</label>
        <Calendar id="dataAte" v-model="filtros.date_to" dateFormat="dd/mm/yy" class="w-full" showClear />
      </div>
      <div class="col-12 md:col-3">
        <label>&nbsp;</label>
        <Button label="Filtrar" icon="pi pi-filter" class="w-full mt-2" @click="() => carregar(true)" />
      </div>
    </div>

    <DataTable
      :value="notasFiscais"
      :paginator="true"
      :rows="itensPorPagina"
      :totalRecords="totalRegistros"
      :lazy="true"
      :first="(paginaAtual - 1) * itensPorPagina"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
      @page="onPageChange"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} notas fiscais"
      :rowsPerPageOptions="[10, 20, 50, 100]"
    >
      <Column field="invoice_number" header="Número" sortable>
        <template #body="slotProps">
          {{ slotProps.data.invoice_number }}{{ slotProps.data.invoice_series ? '/' + slotProps.data.invoice_series : '' }}
        </template>
      </Column>
      <Column field="invoice_date" header="Data de Emissão" sortable>
        <template #body="slotProps">
          {{ slotProps.data.invoice_date || '-' }}
        </template>
      </Column>
      <Column field="received_date" header="Data de Recebimento" sortable>
        <template #body="slotProps">
          {{ slotProps.data.received_date || '-' }}
        </template>
      </Column>
      <Column field="supplier_name" header="Fornecedor" sortable>
        <template #body="slotProps">
          {{ slotProps.data.supplier_name || '-' }}
        </template>
      </Column>
      <Column field="order.order_number" header="Nº Pedido" sortable>
        <template #body="slotProps">
          {{ slotProps.data.order?.order_number || '-' }}
        </template>
      </Column>
      <Column field="items_count" header="Qtd. Itens" sortable>
        <template #body="slotProps">
          {{ slotProps.data.items_count || 0 }}
        </template>
      </Column>
      <Column field="total_amount" header="Valor Total" sortable>
        <template #body="slotProps">
          {{ formatarValor(slotProps.data.total_amount) }}
        </template>
      </Column>
      <Column field="created_by_user.nome_completo" header="Criado Por" sortable>
        <template #body="slotProps">
          {{ slotProps.data.created_by_user?.nome_completo || '-' }}
        </template>
      </Column>
      <Column field="created_at" header="Data de Criação" sortable>
        <template #body="slotProps">
          {{ slotProps.data.created_at || '-' }}
        </template>
      </Column>
      <Column header="Ações">
        <template #body="slotProps">
          <Button
            icon="pi pi-eye"
            class="p-button-rounded p-button-text p-button-info"
            v-tooltip.top="'Visualizar Detalhes'"
            @click="visualizarDetalhes(slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Modal de Detalhes -->
    <Dialog v-model:visible="modalDetalhes.visivel" modal header="Detalhes da Nota Fiscal" :style="{ width: '90vw', maxWidth: '1200px' }" appendTo="body">
      <div v-if="modalDetalhes.nota" class="mb-4">
        <div class="grid mb-3">
          <div class="col-12 md:col-3">
            <strong>Número:</strong> {{ modalDetalhes.nota.invoice_number }}{{ modalDetalhes.nota.invoice_series ? '/' + modalDetalhes.nota.invoice_series : '' }}
          </div>
          <div class="col-12 md:col-3">
            <strong>Data de Emissão:</strong> {{ modalDetalhes.nota.invoice_date || '-' }}
          </div>
          <div class="col-12 md:col-3">
            <strong>Data de Recebimento:</strong> {{ modalDetalhes.nota.received_date || '-' }}
          </div>
          <div class="col-12 md:col-3">
            <strong>Valor Total:</strong> {{ formatarValor(modalDetalhes.nota.total_amount) }}
          </div>
          <div class="col-12 md:col-6">
            <strong>Fornecedor:</strong> {{ modalDetalhes.nota.supplier_name || '-' }}
          </div>
          <div class="col-12 md:col-6">
            <strong>CNPJ/CPF:</strong> {{ modalDetalhes.nota.supplier_document || '-' }}
          </div>
          <div class="col-12 md:col-6" v-if="modalDetalhes.nota.order?.order_number">
            <strong>Nº Pedido:</strong> {{ modalDetalhes.nota.order.order_number }}
          </div>
          <div class="col-12 md:col-6">
            <strong>Criado Por:</strong> {{ modalDetalhes.nota.created_by_user?.nome_completo || '-' }}
          </div>
          <div class="col-12 md:col-6">
            <strong>Data de Criação:</strong> {{ modalDetalhes.nota.created_at || '-' }}
          </div>
          <div class="col-12" v-if="modalDetalhes.nota.observation">
            <strong>Observações:</strong> {{ modalDetalhes.nota.observation }}
          </div>
        </div>

        <h6 class="mb-3">Itens da Nota Fiscal</h6>
        <DataTable :value="modalDetalhes.nota.items || []" class="p-datatable-sm">
          <Column field="product_code" header="Código" sortable></Column>
          <Column field="product_description" header="Descrição" sortable></Column>
          <Column field="quantity" header="Quantidade" sortable>
            <template #body="slotProps">
              {{ formatarQuantidade(slotProps.data.quantity) }}
            </template>
          </Column>
          <Column field="unit" header="Unidade" sortable></Column>
          <Column field="unit_price" header="Preço Unitário" sortable>
            <template #body="slotProps">
              {{ formatarValor(slotProps.data.unit_price) }}
            </template>
          </Column>
          <Column field="total_price" header="Preço Total" sortable>
            <template #body="slotProps">
              {{ formatarValor(slotProps.data.total_price) }}
            </template>
          </Column>
          <Column field="location.name" header="Local de Estoque" sortable>
            <template #body="slotProps">
              {{ slotProps.data.location?.name || '-' }}
            </template>
          </Column>
          <Column field="observation" header="Observação" sortable>
            <template #body="slotProps">
              {{ slotProps.data.observation || '-' }}
            </template>
          </Column>
        </DataTable>
      </div>
      <template #footer>
        <Button label="Fechar" class="p-button-text" @click="fecharModalDetalhes" />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import PermissionsService from '@/service/PermissionsService';
import PurchaseInvoiceService from '@/service/PurchaseInvoiceService';
import { usePaginationPersist } from '@/composables/usePaginationPersist';

export default {
  name: 'NotasFiscaisList',
  setup() {
    const toast = useToast();
    const store = useStore();
    const router = useRouter();
    const { getInitialPagination, savePagination } = usePaginationPersist('notas-fiscais', 10);
    const saved = getInitialPagination();
    const service = new PurchaseInvoiceService();
    const permissionService = new PermissionsService();

    const notasFiscais = ref([]);
    const carregando = ref(false);
    const totalRegistros = ref(0);
    const paginaAtual = ref(saved.page);
    const itensPorPagina = ref(saved.rows);

    const filtros = ref({
      invoice_number: '',
      supplier_name: '',
      date_from: null,
      date_to: null,
    });

    const modalDetalhes = reactive({
      visivel: false,
      nota: null,
    });

    const formatarValor = (valor) => {
      if (!valor) return 'R$ 0,00';
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(valor);
    };

    const formatarQuantidade = (qtd) => {
      return qtd ? parseFloat(qtd).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '0,0000';
    };

    const carregar = async (resetarPagina = false) => {
      try {
        carregando.value = true;
        if (resetarPagina) paginaAtual.value = 1;

        const params = {
          per_page: itensPorPagina.value,
          page: paginaAtual.value,
        };

        if (filtros.value.invoice_number) {
          params.invoice_number = filtros.value.invoice_number;
        }
        if (filtros.value.supplier_name) {
          params.supplier_name = filtros.value.supplier_name;
        }
        if (filtros.value.date_from) {
          const dateFrom = filtros.value.date_from instanceof Date 
            ? filtros.value.date_from 
            : new Date(filtros.value.date_from);
          params.date_from = dateFrom.toISOString().split('T')[0];
        }
        if (filtros.value.date_to) {
          const dateTo = filtros.value.date_to instanceof Date 
            ? filtros.value.date_to 
            : new Date(filtros.value.date_to);
          params.date_to = dateTo.toISOString().split('T')[0];
        }

        const { data } = await service.getAll(params);
        notasFiscais.value = data.data || [];
        totalRegistros.value = data.total ?? data.pagination?.total ?? notasFiscais.value.length;
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar notas fiscais', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };

    const onPageChange = (event) => {
      const newPage = event.page + 1;
      const newRows = event.rows;
      savePagination(newRows, newPage);
      paginaAtual.value = newPage;
      itensPorPagina.value = newRows;
      carregar();
    };

    const visualizarDetalhes = async (nota) => {
      try {
        const { data } = await service.getById(nota.id);
        modalDetalhes.nota = data.data || data;
        modalDetalhes.visivel = true;
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar detalhes da nota fiscal', life: 3000 });
      }
    };

    const fecharModalDetalhes = () => {
      modalDetalhes.visivel = false;
      modalDetalhes.nota = null;
    };

    onMounted(() => {
      if (!permissionService.hasPermissions('view_controle_notas_fiscais')) {
        router.push('/');
        return;
      }
      carregar();
    });

    return {
      notasFiscais,
      carregando,
      totalRegistros,
      itensPorPagina,
      filtros,
      modalDetalhes,
      formatarValor,
      formatarQuantidade,
      carregar,
      onPageChange,
      visualizarDetalhes,
      fecharModalDetalhes,
    };
  },
};
</script>

