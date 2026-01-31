<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Descrições Padrão de Ativos</h5>
      <Button 
        v-if="podeCriar"
        label="Nova Descrição" 
        icon="pi pi-plus" 
        @click="$router.push('/ativos/descricoes-padrao/add')" 
      />
    </div>

    <div class="flex justify-content-end mb-3">
      <span class="p-input-icon-left">
        <i class="pi pi-search" />
        <InputText
          v-model="filtroGlobal"
          placeholder="Buscar..."
          class="p-inputtext-sm"
          style="width: 16rem"
          @keyup.enter="() => carregar(true)"
        />
      </span>
      <Button label="Buscar" icon="pi pi-search" class="p-button-outlined ml-2" @click="() => carregar(true)" />
    </div>

    <DataTable
      :value="descricoes"
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
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} descrições"
      :rowsPerPageOptions="[10, 20, 50, 100]"
    >
      <Column field="code" header="Código" sortable></Column>
      <Column field="name" header="Nome" sortable></Column>
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
            v-tooltip.top="'Editar'"
            @click="$router.push(`/ativos/descricoes-padrao/${slotProps.data.id}`)"
          />
          <Button
            v-if="podeDeletar"
            icon="pi pi-trash"
            class="p-button-rounded p-button-text p-button-danger"
            v-tooltip.top="'Excluir'"
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
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import PermissionsService from '@/service/PermissionsService';
import AssetAuxiliaryService from '@/service/AssetAuxiliaryService';

export default {
  name: 'DescricoesPadraoList',
  setup() {
    const toast = useToast();
    const confirm = useConfirm();
    const router = useRouter();
    const store = useStore();
    const descricoes = ref([]);
    const filtroGlobal = ref('');
    const carregando = ref(false);
    const totalRecords = ref(0);
    const page = ref(1);
    const rows = ref(10);
    const service = new AssetAuxiliaryService('descricoes-padrao');
    const permissionService = new PermissionsService();

    const podeCriar = computed(() => {
      return permissionService.hasPermissions('view_ativos_descricoes_padrao_create');
    });

    const podeEditar = computed(() => {
      return permissionService.hasPermissions('view_ativos_descricoes_padrao_edit');
    });

    const podeDeletar = computed(() => {
      return permissionService.hasPermissions('view_ativos_descricoes_padrao_delete');
    });

    const carregar = async (resetarPagina = false) => {
      try {
        carregando.value = true;
        if (resetarPagina) page.value = 1;

        const params = { all: true, page: page.value, per_page: rows.value };
        if (filtroGlobal.value?.trim()) params.search = filtroGlobal.value.trim();

        const res = await service.getAll(params);
        const data = res?.data;
        const raw = data?.data ?? data;
        const list = Array.isArray(raw)
          ? raw
          : (raw && typeof raw === 'object' && Array.isArray(raw.data)
            ? raw.data
            : []);
        descricoes.value = Array.isArray(list) ? list : [];
        const pag = data?.pagination ?? raw?.pagination ?? {};
        totalRecords.value = pag.total ?? data?.total ?? raw?.total ?? descricoes.value.length;
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar descrições padrão', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };

    const onPage = (event) => {
      page.value = event.page + 1;
      rows.value = event.rows;
      carregar();
    };

    const confirmarExclusao = (descricao) => {
      confirm.require({
        message: `Deseja realmente excluir a descrição padrão "${descricao.name}"?`,
        header: 'Confirmar Exclusão',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Excluir',
        rejectLabel: 'Cancelar',
        accept: async () => {
          try {
            await service.delete(descricao.id);
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Descrição padrão excluída com sucesso', life: 3000 });
            await carregar();
          } catch (error) {
            toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao excluir descrição padrão', life: 3000 });
          }
        }
      });
    };

    onMounted(() => {
      if (!permissionService.hasPermissions('view_ativos_descricoes_padrao')) {
        router.push('/');
        return;
      }
      carregar();
    });

    return {
      descricoes,
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

