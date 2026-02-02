<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h5 class="text-900 m-0">Termos de Responsabilidade (Ferramentas)</h5>
      <Button
        label="Novo Termo"
        icon="pi pi-plus"
        class="p-button-success"
        @click="router.push({ name: 'estoqueTermosResponsabilidadeAdd' })"
      />
    </div>
    <p class="text-600 mt-0 mb-3">
      Ferramentas e equipamentos entregues a colaboradores (montagem, obra). Ao devolver, os itens retornam ao estoque.
    </p>

    <div class="grid mb-3">
      <div class="col-12 md:col-4">
        <label>Status</label>
        <Dropdown
          v-model="filtros.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos"
          class="w-full"
          showClear
        />
      </div>
      <div class="col-12 md:col-4">
        <label>Buscar (número, responsável, obra)</label>
        <InputText
          v-model="filtros.search"
          placeholder="Buscar..."
          class="w-full"
          @keyup.enter="carregar"
        />
      </div>
      <div class="col-12 md:col-4 flex align-items-end">
        <Button label="Filtrar" icon="pi pi-search" @click="carregar" />
      </div>
    </div>

    <DataTable
      :value="termos"
      :paginator="true"
      :rows="paginacao.perPage"
      :totalRecords="paginacao.total"
      :lazy="true"
      :first="(paginacao.page - 1) * paginacao.perPage"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
      @page="onPageChange"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 20, 50]"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} termos"
    >
      <Column field="numero" header="Número" sortable />
      <Column field="responsible_name" header="Responsável" sortable />
      <Column field="project" header="Obra/Projeto">
        <template #body="slotProps">
          {{ slotProps.data.project || '-' }}
        </template>
      </Column>
      <Column field="stock_location" header="Local">
        <template #body="slotProps">
          {{ slotProps.data.stock_location?.name || '-' }}
        </template>
      </Column>
      <Column field="status" header="Status">
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.status === 'devolvido' ? 'Devolvido' : 'Aberto'"
            :severity="slotProps.data.status === 'devolvido' ? 'success' : 'warning'"
          />
        </template>
      </Column>
      <Column field="created_at" header="Data">
        <template #body="slotProps">
          {{ formatarData(slotProps.data.created_at) }}
        </template>
      </Column>
      <Column header="Ações" :exportable="false" style="min-width: 180px">
        <template #body="slotProps">
          <div class="flex gap-1">
            <Button
              icon="pi pi-eye"
              class="p-button-rounded p-button-text p-button-info p-button-sm"
              v-tooltip.top="'Visualizar'"
              @click="visualizar(slotProps.data)"
            />
            <Button
              icon="pi pi-file-pdf"
              class="p-button-rounded p-button-text p-button-danger p-button-sm"
              v-tooltip.top="'Baixar PDF'"
              @click="baixarPdf(slotProps.data.id)"
            />
            <Button
              v-if="slotProps.data.status === 'aberto'"
              icon="pi pi-replay"
              class="p-button-rounded p-button-text p-button-success p-button-sm"
              v-tooltip.top="'Devolver (retornar ao estoque)'"
              @click="confirmarDevolver(slotProps.data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <ConfirmDialog />
    <Toast />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import ResponsibilityTermService from '@/service/ResponsibilityTermService';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const termos = ref([]);
const carregando = ref(false);
const paginacao = ref({ page: 1, perPage: 10, total: 0 });
const filtros = reactive({ status: null, search: '' });

const statusOptions = [
  { label: 'Aberto', value: 'aberto' },
  { label: 'Devolvido', value: 'devolvido' },
];

const formatarData = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const montarParams = () => {
  const p = { page: paginacao.value.page, per_page: paginacao.value.perPage };
  if (filtros.status) p.status = filtros.status;
  if (filtros.search?.trim()) p.search = filtros.search.trim();
  return p;
};

const carregar = async () => {
  carregando.value = true;
  try {
    const { data } = await ResponsibilityTermService.list(montarParams());
    termos.value = data?.data ?? [];
    const meta = data?.meta ?? {};
    paginacao.value.total = meta.total ?? 0;
    paginacao.value.page = meta.current_page ?? 1;
    paginacao.value.perPage = meta.per_page ?? 10;
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro', detail: e?.response?.data?.message || 'Falha ao carregar.', life: 4000 });
    termos.value = [];
  } finally {
    carregando.value = false;
  }
};

const onPageChange = (event) => {
  paginacao.value.page = event.page + 1;
  paginacao.value.perPage = event.rows;
  carregar();
};

const visualizar = (row) => {
  router.push({ name: 'estoqueTermosResponsabilidadeView', params: { id: String(row.id) } });
};

const baixarPdf = async (id) => {
  try {
    const { data } = await ResponsibilityTermService.pdf(id);
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `termo-responsabilidade-${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.add({ severity: 'success', summary: 'PDF', detail: 'Download iniciado.', life: 2000 });
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro', detail: e?.response?.data?.message || 'Falha ao gerar PDF.', life: 4000 });
  }
};

const confirmarDevolver = (row) => {
  confirm.require({
    message: `Confirmar devolução do termo ${row.numero}? Os itens retornarão ao estoque.`,
    header: 'Devolver Termo',
    icon: 'pi pi-replay',
    acceptClass: 'p-button-success',
    acceptLabel: 'Sim, devolver',
    rejectLabel: 'Cancelar',
    accept: async () => {
      try {
        await ResponsibilityTermService.devolver(row.id);
        toast.add({ severity: 'success', summary: 'Devolvido', detail: 'Itens retornaram ao estoque.', life: 4000 });
        carregar();
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Erro', detail: e?.response?.data?.message || 'Falha ao devolver.', life: 4000 });
      }
    },
  });
};

onMounted(carregar);
</script>
