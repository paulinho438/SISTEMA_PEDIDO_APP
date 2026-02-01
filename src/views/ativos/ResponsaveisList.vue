<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Cadastro de Responsáveis de Ativo</h5>
      <Button 
        v-if="podeCriar"
        label="Novo Responsável" 
        icon="pi pi-plus" 
        @click="$router.push('/ativos/responsaveis/add')" 
      />
    </div>

    <div class="flex justify-content-end mb-3">
      <span class="p-input-icon-left">
        <i class="pi pi-search" />
        <InputText
          v-model="filtroGlobal"
          placeholder="Buscar por nome ou matrícula..."
          class="p-inputtext-sm"
          style="width: 20rem"
          @keyup.enter="() => carregar(true)"
        />
      </span>
      <Button label="Buscar" icon="pi pi-search" class="p-button-outlined ml-2" @click="() => carregar(true)" />
    </div>

    <DataTable
      :value="responsaveis"
      :paginator="true"
      :rows="rows"
      :totalRecords="totalRecords"
      :lazy="true"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
      @page="onPage"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} responsáveis"
      :rowsPerPageOptions="[10, 20, 50, 100]"
    >
      <Column field="code" header="Código" sortable></Column>
      <Column field="name" header="Nome" sortable></Column>
      <Column field="matricula" header="Matrícula" sortable>
        <template #body="slotProps">
          {{ slotProps.data.matricula || '-' }}
        </template>
      </Column>
      <Column field="description" header="Descrição" sortable>
        <template #body="slotProps">
          {{ slotProps.data.description || '-' }}
        </template>
      </Column>
      <Column field="active" header="Ativo" sortable>
        <template #body="slotProps">
          <Tag :value="slotProps.data.active ? 'Ativo' : 'Inativo'" :severity="slotProps.data.active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="Ações">
        <template #body="slotProps">
          <Button
            v-if="podeEditar"
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text p-button-info mr-2"
            @click="$router.push(`/ativos/responsaveis/${slotProps.data.id}`)"
          />
          <Button
            v-if="podeDeletar"
            icon="pi pi-trash"
            class="p-button-rounded p-button-text p-button-danger"
            @click="confirmarExclusao(slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import AssetAuxiliaryService from '@/service/AssetAuxiliaryService';
import PermissionsService from '@/service/PermissionsService';
import { usePaginationPersist } from '@/composables/usePaginationPersist';

export default {
  name: 'ResponsaveisList',
  setup() {
    const toast = useToast();
    const confirm = useConfirm();
    const { getInitialPagination, savePagination } = usePaginationPersist('responsaveis', 10);
    const saved = getInitialPagination();
    const responsaveis = ref([]);
    const filtroGlobal = ref('');
    const carregando = ref(false);
    const totalRecords = ref(0);
    const page = ref(saved.page);
    const rows = ref(saved.rows);
    const service = new AssetAuxiliaryService('responsaveis');
    const permissionService = new PermissionsService();

    const podeCriar = computed(() => {
      return permissionService.hasPermissions('view_ativos_responsaveis_create');
    });

    const podeEditar = computed(() => {
      return permissionService.hasPermissions('view_ativos_responsaveis_edit');
    });

    const podeDeletar = computed(() => {
      return permissionService.hasPermissions('view_ativos_responsaveis_delete');
    });

    const carregar = async (resetarPagina = false) => {
      try {
        carregando.value = true;
        if (resetarPagina) page.value = 1;

        const params = { all: true, page: page.value, per_page: rows.value };
        if (filtroGlobal.value?.trim()) params.search = filtroGlobal.value.trim();

        const res = await service.getAll(params);
        const body = res?.data ?? res;
        // API retorna { data: [...], pagination?: { total } }
        const items = Array.isArray(body?.data) ? body.data : (Array.isArray(body) ? body : []);
        responsaveis.value = Array.isArray(items) ? items : [];
        const pag = body?.pagination || {};
        totalRecords.value = Number(pag.total) ?? Number(body?.total) ?? responsaveis.value.length;
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar responsáveis', life: 3000 });
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

    const confirmarExclusao = (responsavel) => {
      confirm.require({
        message: `Deseja realmente excluir o responsável "${responsavel.name}"?`,
        header: 'Confirmar Exclusão',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Excluir',
        rejectLabel: 'Cancelar',
        accept: async () => {
          try {
            await service.delete(responsavel.id);
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Responsável excluído com sucesso', life: 3000 });
            await carregar();
          } catch (error) {
            toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao excluir responsável', life: 3000 });
          }
        }
      });
    };

    onMounted(() => {
      carregar();
    });

    return {
      responsaveis,
      filtroGlobal,
      carregando,
      totalRecords,
      rows,
      onPage,
      podeCriar,
      podeEditar,
      podeDeletar,
      confirmarExclusao,
      carregar,
    };
  },
};
</script>
