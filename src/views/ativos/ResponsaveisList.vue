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
        <InputText v-model="filtroGlobal" placeholder="Buscar..." class="p-inputtext-sm" style="width: 16rem" />
      </span>
    </div>

    <DataTable
      :value="responsaveisFiltrados"
      :paginator="true"
      :rows="10"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
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

export default {
  name: 'ResponsaveisList',
  setup() {
    const toast = useToast();
    const confirm = useConfirm();
    const responsaveis = ref([]);
    const filtroGlobal = ref('');
    const carregando = ref(false);
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

    const responsaveisFiltrados = computed(() => {
      if (!filtroGlobal.value) return responsaveis.value;
      const filtro = filtroGlobal.value.toLowerCase();
      return responsaveis.value.filter(r =>
        r.code?.toLowerCase().includes(filtro) ||
        r.name?.toLowerCase().includes(filtro) ||
        r.description?.toLowerCase().includes(filtro)
      );
    });

    const carregar = async () => {
      try {
        carregando.value = true;
        const { data } = await service.getAll({ all: true });
        responsaveis.value = data?.data || data || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar responsáveis', life: 3000 });
      } finally {
        carregando.value = false;
      }
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
      responsaveisFiltrados,
      filtroGlobal,
      carregando,
      podeCriar,
      podeEditar,
      podeDeletar,
      confirmarExclusao,
    };
  },
};
</script>
