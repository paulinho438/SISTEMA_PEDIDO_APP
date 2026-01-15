<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Cadastro de Filiais</h5>
      <Button label="Nova Filial" icon="pi pi-plus" @click="$router.push('/ativos/filiais/add')" />
    </div>

    <div class="flex justify-content-end mb-3">
      <span class="p-input-icon-left">
        <i class="pi pi-search" />
        <InputText v-model="filtroGlobal" placeholder="Buscar..." class="p-inputtext-sm" style="width: 16rem" />
      </span>
    </div>

    <DataTable
      :value="filiaisFiltradas"
      :paginator="true"
      :rows="10"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
    >
      <Column field="code" header="Código" sortable></Column>
      <Column field="name" header="Descrição" sortable></Column>
      <Column field="address" header="Endereço" sortable>
        <template #body="slotProps">
          {{ slotProps.data.address || '-' }}
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
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text p-button-info mr-2"
            @click="$router.push(`/ativos/filiais/${slotProps.data.id}`)"
          />
          <Button
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

export default {
  name: 'FiliaisList',
  setup() {
    const toast = useToast();
    const confirm = useConfirm();
    const filiais = ref([]);
    const filtroGlobal = ref('');
    const carregando = ref(false);
    const service = new AssetAuxiliaryService('filiais');

    const filiaisFiltradas = computed(() => {
      if (!filtroGlobal.value) return filiais.value;
      const filtro = filtroGlobal.value.toLowerCase();
      return filiais.value.filter(f =>
        f.code?.toLowerCase().includes(filtro) ||
        f.name?.toLowerCase().includes(filtro) ||
        f.address?.toLowerCase().includes(filtro)
      );
    });

    const carregar = async () => {
      try {
        carregando.value = true;
        const { data } = await service.getAll({ all: true });
        filiais.value = data?.data || data || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar filiais', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };

    const confirmarExclusao = (filial) => {
      confirm.require({
        message: `Deseja realmente excluir a filial "${filial.name}"?`,
        header: 'Confirmar Exclusão',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Excluir',
        rejectLabel: 'Cancelar',
        accept: async () => {
          try {
            await service.delete(filial.id);
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Filial excluída com sucesso', life: 3000 });
            await carregar();
          } catch (error) {
            toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao excluir filial', life: 3000 });
          }
        }
      });
    };

    onMounted(() => {
      carregar();
    });

    return {
      filiais,
      filiaisFiltradas,
      filtroGlobal,
      carregando,
      confirmarExclusao,
    };
  },
};
</script>

