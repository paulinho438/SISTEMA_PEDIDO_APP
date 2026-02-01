<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Locais de Estoque</h5>
      <Button 
        v-if="podeCriar"
        label="Novo Local" 
        icon="pi pi-plus" 
        @click="$router.push('/estoque/locais/add')" 
      />
    </div>

    <div class="flex justify-content-end mb-3">
      <span class="p-input-icon-left">
        <i class="pi pi-search" />
        <InputText v-model="filtroGlobal" placeholder="Buscar..." class="p-inputtext-sm" style="width: 16rem" @input="onSearchChange" />
      </span>
    </div>

    <DataTable
      :value="locais"
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
      :rowsPerPageOptions="[10, 20, 50, 100]"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} locais"
    >
      <Column field="code" header="Código" sortable></Column>
      <Column field="name" header="Nome" sortable></Column>
      <Column field="address" header="Endereço" sortable></Column>
      <Column field="active" header="Ativo" sortable>
        <template #body="slotProps">
          <Tag :value="slotProps.data.active ? 'Sim' : 'Não'" :severity="slotProps.data.active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="Ações">
        <template #body="slotProps">
          <Button
            v-if="podeVisualizar"
            icon="pi pi-eye"
            class="p-button-rounded p-button-text p-button-info mr-2"
            @click="$router.push(`/estoque/locais/${slotProps.data.id}?view=true`)"
            v-tooltip.top="'Visualizar'"
          />
          <Button
            v-if="podeEditar"
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text p-button-info mr-2"
            @click="$router.push(`/estoque/locais/${slotProps.data.id}`)"
            v-tooltip.top="'Editar'"
          />
          <Button
            v-if="podeDeletar"
            :icon="slotProps.data.active ? 'pi pi-ban' : 'pi pi-check'"
            :class="slotProps.data.active ? 'p-button-rounded p-button-text p-button-warning' : 'p-button-rounded p-button-text p-button-success'"
            @click="toggleActive(slotProps.data)"
            v-tooltip.top="slotProps.data.active ? 'Desativar' : 'Ativar'"
          />
        </template>
      </Column>
    </DataTable>

    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import PermissionsService from '@/service/PermissionsService';
import StockLocationService from '@/service/StockLocationService';
import { usePaginationPersist } from '@/composables/usePaginationPersist';

export default {
  name: 'LocaisList',
  setup() {
    const toast = useToast();
    const store = useStore();
    const permissionService = new PermissionsService();
    const { getInitialPagination, savePagination } = usePaginationPersist('locais-estoque', 10);
    const saved = getInitialPagination();
    const locais = ref([]);
    const filtroGlobal = ref('');
    const carregando = ref(false);
    const searchTimeout = ref(null);
    const service = new StockLocationService();

    const paginacao = ref({
      page: saved.page,
      perPage: saved.rows,
      total: 0,
      lastPage: 1,
    });

    // Verificar permissões
    const podeCriar = computed(() => permissionService.hasPermissions('view_estoque_locais_create'));
    const podeVisualizar = computed(() => permissionService.hasPermissions('view_estoque_locais'));
    const podeEditar = computed(() => permissionService.hasPermissions('view_estoque_locais_edit'));
    const podeDeletar = computed(() => permissionService.hasPermissions('view_estoque_locais_delete'));

    const carregar = async () => {
      try {
        carregando.value = true;
        const params = {
          page: paginacao.value.page,
          per_page: paginacao.value.perPage,
        };
        if (filtroGlobal.value) params.search = filtroGlobal.value;
        const { data } = await service.getAll(params);
        locais.value = data.data || [];
        const meta = data.meta || data;
        paginacao.value.total = meta.total ?? data.total ?? 0;
        paginacao.value.page = meta.current_page ?? data.current_page ?? 1;
        paginacao.value.perPage = meta.per_page ?? data.per_page ?? 10;
        paginacao.value.lastPage = meta.last_page ?? data.last_page ?? 1;
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar locais', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };

    const onPageChange = (event) => {
      const newPage = event.page + 1;
      const newRows = event.rows;
      savePagination(newRows, newPage);
      paginacao.value.page = newPage;
      paginacao.value.perPage = newRows;
      carregar();
    };

    const onSearchChange = () => {
      if (searchTimeout.value) clearTimeout(searchTimeout.value);
      searchTimeout.value = setTimeout(() => {
        paginacao.value.page = 1;
        carregar();
      }, 400);
    };

    const toggleActive = async (local) => {
      try {
        await service.toggleActive(local.id);
        await carregar();
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Status alterado com sucesso', life: 3000 });
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao alterar status', life: 3000 });
      }
    };

    onMounted(() => {
      carregar();
    });

    return {
      locais,
      filtroGlobal,
      paginacao,
      carregando,
      toggleActive,
      podeCriar,
      podeVisualizar,
      podeEditar,
      podeDeletar,
      carregar,
      onPageChange,
      onSearchChange,
    };
  },
};
</script>

