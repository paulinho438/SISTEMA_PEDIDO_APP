<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Cadastro de Locais</h5>
      <Button label="Novo Local" icon="pi pi-plus" @click="$router.push('/ativos/locais/add')" />
    </div>

    <div class="flex justify-content-end mb-3">
      <span class="p-input-icon-left">
        <i class="pi pi-search" />
        <InputText v-model="filtroGlobal" placeholder="Buscar..." class="p-inputtext-sm" style="width: 16rem" />
      </span>
    </div>

    <DataTable
      :value="locaisFiltrados"
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
            @click="$router.push(`/ativos/locais/${slotProps.data.id}`)"
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
  name: 'LocaisList',
  setup() {
    const toast = useToast();
    const confirm = useConfirm();
    const locais = ref([]);
    const filtroGlobal = ref('');
    const carregando = ref(false);
    const service = new AssetAuxiliaryService('locais');

    const locaisFiltrados = computed(() => {
      if (!filtroGlobal.value) return locais.value;
      const filtro = filtroGlobal.value.toLowerCase();
      return locais.value.filter(l =>
        l.code?.toLowerCase().includes(filtro) ||
        l.name?.toLowerCase().includes(filtro) ||
        l.address?.toLowerCase().includes(filtro)
      );
    });

    const carregar = async () => {
      try {
        carregando.value = true;
        const { data } = await service.getAll({ all: true });
        locais.value = data?.data || data || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar locais', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };

    const confirmarExclusao = (local) => {
      confirm.require({
        message: `Deseja realmente excluir o local "${local.name}"?`,
        header: 'Confirmar Exclusão',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Excluir',
        rejectLabel: 'Cancelar',
        accept: async () => {
          try {
            await service.delete(local.id);
            toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Local excluído com sucesso', life: 3000 });
            await carregar();
          } catch (error) {
            toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao excluir local', life: 3000 });
          }
        }
      });
    };

    onMounted(() => {
      carregar();
    });

    return {
      locais,
      locaisFiltrados,
      filtroGlobal,
      carregando,
      confirmarExclusao,
    };
  },
};
</script>

