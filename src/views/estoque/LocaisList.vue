<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Locais de Estoque</h5>
      <Button label="Novo Local" icon="pi pi-plus" @click="$router.push('/estoque/locais/add')" />
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
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text p-button-info mr-2"
            @click="$router.push(`/estoque/locais/${slotProps.data.id}`)"
          />
          <Button
            :icon="slotProps.data.active ? 'pi pi-ban' : 'pi pi-check'"
            :class="slotProps.data.active ? 'p-button-rounded p-button-text p-button-warning' : 'p-button-rounded p-button-text p-button-success'"
            @click="toggleActive(slotProps.data)"
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
import StockLocationService from '@/service/StockLocationService';

export default {
  name: 'LocaisList',
  setup() {
    const toast = useToast();
    const locais = ref([]);
    const filtroGlobal = ref('');
    const carregando = ref(false);
    const service = new StockLocationService();

    const locaisFiltrados = computed(() => {
      if (!filtroGlobal.value) return locais.value;
      const filtro = filtroGlobal.value.toLowerCase();
      return locais.value.filter(l =>
        l.code?.toLowerCase().includes(filtro) ||
        l.name?.toLowerCase().includes(filtro)
      );
    });

    const carregar = async () => {
      try {
        carregando.value = true;
        const { data } = await service.getAll({ per_page: 100 });
        locais.value = data.data || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar locais', life: 3000 });
      } finally {
        carregando.value = false;
      }
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
      locaisFiltrados,
      carregando,
      toggleActive,
    };
  },
};
</script>

