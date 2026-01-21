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
        <InputText v-model="filtroGlobal" placeholder="Buscar..." class="p-inputtext-sm" style="width: 16rem" />
      </span>
    </div>

    <DataTable
      :value="descricoesFiltradas"
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

    const descricoesFiltradas = computed(() => {
      if (!filtroGlobal.value) return descricoes.value;
      const filtro = filtroGlobal.value.toLowerCase();
      return descricoes.value.filter(d =>
        d.code?.toLowerCase().includes(filtro) ||
        d.name?.toLowerCase().includes(filtro) ||
        d.description?.toLowerCase().includes(filtro)
      );
    });

    const carregar = async () => {
      try {
        carregando.value = true;
        const { data } = await service.getAll({ all: true });
        descricoes.value = data?.data || data || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar descrições padrão', life: 3000 });
      } finally {
        carregando.value = false;
      }
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
      descricoesFiltradas,
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

