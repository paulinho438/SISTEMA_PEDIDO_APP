<template>
  <div class="card p-4">
    <div class="flex justify-content-between align-items-center mb-3">
      <div>
        <h5 class="m-0 text-900">Edição Master de Cotações</h5>
        <p class="m-0 text-600 text-sm">Liste e edite qualquer cotação, independente do status.</p>
      </div>
      <div class="flex align-items-center gap-2">
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText
            v-model="filtroGlobal"
            placeholder="Buscar por número, solicitante ou local..."
            class="p-inputtext-sm"
            style="width: 18rem"
            @keyup.enter="carregar(true)"
          />
        </span>
      </div>
    </div>

    <div class="flex flex-wrap align-items-center gap-3 mb-3">
      <div class="flex align-items-center gap-2">
        <label for="filtroStatus" class="text-900 font-medium">Status:</label>
        <Dropdown
          id="filtroStatus"
          v-model="filtroStatus"
          :options="opcoesStatus"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos"
          class="w-12rem"
          showClear
          @change="() => carregar(true)"
        />
      </div>
      <Button label="Buscar" icon="pi pi-search" class="p-button-outlined" @click="() => carregar(true)" />
    </div>

    <DataTable
      :value="cotacoes"
      :paginator="true"
      :rows="rows"
      :totalRecords="totalRecords"
      :lazy="true"
      dataKey="id"
      responsiveLayout="scroll"
      :loading="carregando"
      @page="onPage"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} cotações"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      class="p-datatable-sm"
    >
      <Column field="numero" header="Nº Cotação" sortable />
      <Column field="data" header="Data" sortable />
      <Column field="solicitante" header="Solicitante" sortable />
      <Column field="centro_custo" header="Centro de Custo" sortable />
      <Column field="local" header="Local" sortable />
      <Column header="Status">
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.status"
            :severity="statusSeverity(slotProps.data.statusSlug)"
            :style="statusStyle(slotProps.data.statusSlug)"
          />
        </template>
      </Column>
      <Column header="Ações" style="width: 7rem">
        <template #body="slotProps">
          <Button
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text p-button-info"
            v-tooltip.top="'Editar cotação (modo master)'"
            @click="editar(slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>

    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import axios from '@/plugins/axios';

const router = useRouter();
const toast = useToast();

const OPCOES_STATUS = [
  { value: null, label: 'Todos' },
  { value: 'aguardando', label: 'Aguardando' },
  { value: 'autorizado', label: 'Autorizado' },
  { value: 'em_analise_supervisor', label: 'Em análise (Supervisor)' },
  { value: 'cotacao', label: 'Cotação' },
  { value: 'compra_em_andamento', label: 'Compra em andamento' },
  { value: 'finalizada', label: 'Finalizada' },
  { value: 'analisada', label: 'Analisada' },
  { value: 'analisada_aguardando', label: 'Analisada / Aguardando' },
  { value: 'analise_gerencia', label: 'Análise Gerência' },
  { value: 'aprovado', label: 'Aprovado' },
];

const cotacoes = ref([]);
const filtroStatus = ref(null);
const filtroGlobal = ref('');
const opcoesStatus = OPCOES_STATUS;
const carregando = ref(false);
const totalRecords = ref(0);
const page = ref(1);
const rows = ref(10);

const carregar = async (resetarPagina = false) => {
  try {
    carregando.value = true;
    if (resetarPagina) page.value = 1;

    const params = {
      page: page.value,
      per_page: rows.value,
    };
    if (filtroStatus.value) params.status = filtroStatus.value;
    if (filtroGlobal.value?.trim()) params.search = filtroGlobal.value.trim();

    const { data } = await axios.get('/cotacoes/admin/list', { params });

    cotacoes.value = data?.data ?? [];
    const pagination = data?.pagination ?? {};
    totalRecords.value = pagination.total ?? cotacoes.value.length;
  } catch (error) {
    const detail = error?.response?.data?.message || 'Não foi possível carregar as cotações para edição master.';
    toast.add({ severity: 'error', summary: 'Erro ao carregar', detail, life: 4000 });
  } finally {
    carregando.value = false;
  }
};

const onPage = (event) => {
  const newPage = event.page + 1;
  const newRows = event.rows;
  page.value = newPage;
  rows.value = newRows;
  carregar();
};

const editar = (row) => {
  router.push({ name: 'novaCotacao', params: { id: String(row.id) }, query: { modo: 'admin' } });
};

const statusSeverity = (slug) => {
  const map = {
    aguardando: 'warning',
    autorizado: 'info',
    cotacao: 'warning',
    compra_em_andamento: 'info',
    finalizada: 'success',
    analisada: 'success',
    analisada_aguardando: 'warning',
    analise_gerencia: 'warn',
    aprovado: 'success',
  };
  return map[slug] ?? 'secondary';
};

const statusStyle = (slug) => {
  const styles = {
    aguardando: { backgroundColor: '#FFEED0', color: '#C47F17', borderRadius: '999px' },
    autorizado: { backgroundColor: '#CDE7FF', color: '#1363B4', borderRadius: '999px' },
    cotacao: { backgroundColor: '#FFEED0', color: '#C47F17', borderRadius: '999px' },
    compra_em_andamento: { backgroundColor: '#CDE7FF', color: '#1363B4', borderRadius: '999px' },
    finalizada: { backgroundColor: '#E0D5FF', color: '#5E37B4', borderRadius: '999px' },
    analisada: { backgroundColor: '#BFF3E0', color: '#0F8558', borderRadius: '999px' },
    analisada_aguardando: { backgroundColor: '#F3F0C7', color: '#9C8A1F', borderRadius: '999px' },
    analise_gerencia: { backgroundColor: '#FAD7DF', color: '#B61643', borderRadius: '999px' },
    aprovado: { backgroundColor: '#CFF5D8', color: '#237A3F', borderRadius: '999px' },
  };
  return styles[slug] ?? { backgroundColor: '#E7E9EE', color: '#475569', borderRadius: '999px' };
};

onMounted(() => {
  carregar(true);
});
</script>

