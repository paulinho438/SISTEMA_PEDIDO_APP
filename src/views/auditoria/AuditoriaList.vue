<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Auditoria</h5>
    </div>
    <p class="text-600 mt-0 mb-4">
      Consulte quem criou ou editou registros no sistema. Use os filtros e a paginação para refinar a busca.
    </p>

    <!-- Filtros -->
    <div class="grid mb-4">
      <div class="col-12 md:col-6 lg:col-2">
        <label class="block text-600 mb-2">Tipo de entidade</label>
        <Dropdown
          v-model="filtros.auditable_type"
          :options="opcoesTipoEntidade"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos"
          class="w-full"
          showClear
        />
      </div>
      <div class="col-12 md:col-6 lg:col-2">
        <label class="block text-600 mb-2">ID da entidade</label>
        <InputText
          v-model="filtros.auditable_id"
          placeholder="Ex: 123"
          class="w-full"
          @keyup.enter="buscar"
        />
      </div>
      <div class="col-12 md:col-6 lg:col-2">
        <label class="block text-600 mb-2">Usuário</label>
        <Dropdown
          v-model="filtros.user_id"
          :options="usuarios"
          optionLabel="name"
          optionValue="id"
          placeholder="Todos"
          class="w-full"
          showClear
          :loading="carregandoUsuarios"
          filter
        />
      </div>
      <div class="col-12 md:col-6 lg:col-2">
        <label class="block text-600 mb-2">Ação</label>
        <Dropdown
          v-model="filtros.action"
          :options="opcoesAcao"
          optionLabel="label"
          optionValue="value"
          placeholder="Todas"
          class="w-full"
          showClear
        />
      </div>
      <div class="col-12 md:col-6 lg:col-2">
        <label class="block text-600 mb-2">Data inicial</label>
        <Calendar
          v-model="filtros.date_from"
          dateFormat="dd/mm/yy"
          showIcon
          placeholder="dd/mm/aaaa"
          class="w-full"
        />
      </div>
      <div class="col-12 md:col-6 lg:col-2">
        <label class="block text-600 mb-2">Data final</label>
        <Calendar
          v-model="filtros.date_to"
          dateFormat="dd/mm/yy"
          showIcon
          placeholder="dd/mm/aaaa"
          class="w-full"
        />
      </div>
      <div class="col-12 flex gap-2 align-items-end">
        <Button label="Buscar" icon="pi pi-search" class="p-button-success" :loading="carregando" @click="buscar" />
        <Button label="Limpar" icon="pi pi-times" class="p-button-secondary" :disabled="carregando" @click="limparFiltros" />
      </div>
    </div>

    <!-- Tabela -->
    <DataTable
      :value="dados"
      :paginator="true"
      :rows="filtros.per_page"
      :totalRecords="totalRecords"
      :lazy="true"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm tabela-auditoria"
      :loading="carregando"
      @page="onPage"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} registros"
      :rowsPerPageOptions="[10, 20, 50, 100]"
    >
      <template #empty>
        <div class="text-center text-600 py-4">
          Nenhum registro de auditoria encontrado. Ajuste os filtros e clique em Buscar.
        </div>
      </template>
      <Column field="created_at" header="Data/Hora" sortable style="min-width: 140px">
        <template #body="slotProps">
          {{ formatarDataHora(slotProps.data.created_at) }}
        </template>
      </Column>
      <Column field="user" header="Usuário" style="min-width: 160px">
        <template #body="slotProps">
          <span v-if="slotProps.data.user">
            {{ slotProps.data.user.name || slotProps.data.user.email || '—' }}
          </span>
          <span v-else class="text-500">—</span>
        </template>
      </Column>
      <Column field="action" header="Ação" style="min-width: 100px">
        <template #body="slotProps">
          <Tag :value="labelAcao(slotProps.data.action)" :severity="severityAcao(slotProps.data.action)" />
        </template>
      </Column>
      <Column field="auditable_type" header="Tipo" style="min-width: 140px">
        <template #body="slotProps">
          {{ labelTipoEntidade(slotProps.data.auditable_type) }}
        </template>
      </Column>
      <Column field="auditable_id" header="ID" style="min-width: 80px" />
      <Column header="Detalhes" style="min-width: 120px">
        <template #body="slotProps">
          <Button
            v-if="temDetalhes(slotProps.data)"
            label="Ver"
            icon="pi pi-eye"
            class="p-button-sm p-button-text"
            @click="abrirDetalhes(slotProps.data)"
          />
          <span v-else class="text-500">—</span>
        </template>
      </Column>
    </DataTable>

    <!-- Modal detalhes -->
    <Dialog
      v-model:visible="modalDetalhes.visivel"
      header="Detalhes do registro de auditoria"
      :style="{ width: '90vw', maxWidth: '700px' }"
      modal
      dismissableMask
    >
      <div v-if="modalDetalhes.item" class="grid">
        <div class="col-12">
          <p><strong>Data/Hora:</strong> {{ formatarDataHora(modalDetalhes.item.created_at) }}</p>
          <p><strong>Usuário:</strong> {{ modalDetalhes.item.user?.name || modalDetalhes.item.user?.email || '—' }}</p>
          <p><strong>Ação:</strong> {{ labelAcao(modalDetalhes.item.action) }}</p>
          <p><strong>Tipo:</strong> {{ labelTipoEntidade(modalDetalhes.item.auditable_type) }}</p>
          <p><strong>ID:</strong> {{ modalDetalhes.item.auditable_id }}</p>
          <p v-if="modalDetalhes.item.ip_address"><strong>IP:</strong> {{ modalDetalhes.item.ip_address }}</p>
        </div>
        <div v-if="modalDetalhes.item.old_values && Object.keys(modalDetalhes.item.old_values).length" class="col-12 md:col-6">
          <label class="block text-600 font-semibold mb-2">Valores anteriores</label>
          <pre class="p-3 surface-100 border-round text-sm overflow-auto" style="max-height: 200px">{{ JSON.stringify(modalDetalhes.item.old_values, null, 2) }}</pre>
        </div>
        <div v-if="modalDetalhes.item.new_values && Object.keys(modalDetalhes.item.new_values).length" class="col-12 md:col-6">
          <label class="block text-600 font-semibold mb-2">Valores novos</label>
          <pre class="p-3 surface-100 border-round text-sm overflow-auto" style="max-height: 200px">{{ JSON.stringify(modalDetalhes.item.new_values, null, 2) }}</pre>
        </div>
      </div>
      <template #footer>
        <Button label="Fechar" class="p-button-text" @click="modalDetalhes.visivel = false" />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import AuditService from '@/service/AuditService';
import axios from '@/plugins/axios';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';

const toast = useToast();
const dados = ref([]);
const totalRecords = ref(0);
const carregando = ref(false);
const carregandoUsuarios = ref(false);
const usuarios = ref([]);

const opcoesTipoEntidade = [
  { value: 'asset', label: 'Ativo' },
  { value: 'purchase_quote', label: 'Cotação / Solicitação' },
  { value: 'purchase_order', label: 'Pedido de Compra' },
  { value: 'purchase_invoice', label: 'Nota Fiscal' },
  { value: 'asset_branch', label: 'Filial' },
  { value: 'asset_location', label: 'Local' },
  { value: 'asset_standard_description', label: 'Descrição Padrão' },
];

const opcoesAcao = [
  { value: 'created', label: 'Criado' },
  { value: 'updated', label: 'Editado' },
  { value: 'deleted', label: 'Excluído' },
];

const filtros = reactive({
  auditable_type: null,
  auditable_id: '',
  user_id: null,
  action: null,
  date_from: null,
  date_to: null,
  page: 1,
  per_page: 20,
});

const modalDetalhes = reactive({
  visivel: false,
  item: null,
});

function labelTipoEntidade(type) {
  const o = opcoesTipoEntidade.find((x) => x.value === type);
  return o ? o.label : type || '—';
}

function labelAcao(action) {
  const o = opcoesAcao.find((x) => x.value === action);
  return o ? o.label : action || '—';
}

function severityAcao(action) {
  if (action === 'created') return 'success';
  if (action === 'updated') return 'info';
  if (action === 'deleted') return 'danger';
  return 'secondary';
}

function formatarDataHora(val) {
  if (!val) return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return val;
  }
}

function temDetalhes(row) {
  return (row.old_values && Object.keys(row.old_values).length) || (row.new_values && Object.keys(row.new_values).length);
}

function abrirDetalhes(row) {
  modalDetalhes.item = row;
  modalDetalhes.visivel = true;
}

function montarParams() {
  const params = { page: filtros.page, per_page: filtros.per_page };
  if (filtros.auditable_type) params.auditable_type = filtros.auditable_type;
  if (filtros.auditable_id?.trim()) params.auditable_id = filtros.auditable_id.trim();
  if (filtros.user_id != null && filtros.user_id !== '') params.user_id = filtros.user_id;
  if (filtros.action) params.action = filtros.action;
  if (filtros.date_from instanceof Date) {
    params.date_from = filtros.date_from.toISOString().split('T')[0];
  } else if (typeof filtros.date_from === 'string' && filtros.date_from) {
    params.date_from = filtros.date_from.split('T')[0] || filtros.date_from;
  }
  if (filtros.date_to instanceof Date) {
    params.date_to = filtros.date_to.toISOString().split('T')[0];
  } else if (typeof filtros.date_to === 'string' && filtros.date_to) {
    params.date_to = filtros.date_to.split('T')[0] || filtros.date_to;
  }
  return params;
}

async function buscar() {
  try {
    carregando.value = true;
    const { data } = await AuditService.getAuditLog(montarParams());
    const list = data?.data ?? [];
    dados.value = Array.isArray(list) ? list : [];
    const pag = data?.pagination ?? {};
    totalRecords.value = pag.total ?? dados.value.length;
    filtros.page = pag.current_page ?? filtros.page;
    filtros.per_page = pag.per_page ?? filtros.per_page;
  } catch (error) {
    const msg = error?.response?.data?.message || 'Não foi possível carregar a auditoria.';
    toast.add({ severity: 'error', summary: 'Erro', detail: msg, life: 4000 });
    dados.value = [];
    totalRecords.value = 0;
  } finally {
    carregando.value = false;
  }
}

function onPage(event) {
  filtros.page = event.page + 1;
  filtros.per_page = event.rows;
  buscar();
}

function limparFiltros() {
  filtros.auditable_type = null;
  filtros.auditable_id = '';
  filtros.user_id = null;
  filtros.action = null;
  filtros.date_from = null;
  filtros.date_to = null;
  filtros.page = 1;
  buscar();
}

async function carregarUsuarios() {
  try {
    carregandoUsuarios.value = true;
    const { data } = await axios.get('/users');
    const list = data?.data ?? data ?? [];
    usuarios.value = Array.isArray(list) ? list : [];
  } catch {
    usuarios.value = [];
  } finally {
    carregandoUsuarios.value = false;
  }
}

onMounted(() => {
  carregarUsuarios();
  buscar();
});
</script>

<style scoped>
.tabela-auditoria :deep(.p-datatable-thead > tr > th) {
  background-color: #f1f5f9;
  color: #0f172a;
  font-weight: 600;
}
</style>
