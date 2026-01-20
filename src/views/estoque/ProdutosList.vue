<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Produtos de Estoque</h5>
      <Button 
        v-if="podeCriar"
        label="Novo Produto" 
        icon="pi pi-plus" 
        @click="$router.push('/estoque/produtos/add')" 
      />
    </div>

    <div class="flex justify-content-end mb-3">
      <span class="p-input-icon-left">
        <i class="pi pi-search" />
        <InputText v-model="filtroGlobal" placeholder="Buscar..." class="p-inputtext-sm" style="width: 16rem" />
      </span>
    </div>

    <DataTable
      :value="produtosFiltrados"
      :paginator="true"
      :rows="10"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
    >
      <Column field="code" header="Código" sortable></Column>
      <Column field="reference" header="Referência" sortable></Column>
      <Column field="description" header="Descrição" sortable></Column>
      <Column field="unit" header="Unidade" sortable></Column>
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
            @click="$router.push(`/estoque/produtos/${slotProps.data.id}?view=true`)"
            v-tooltip.top="'Visualizar'"
          />
          <Button
            v-if="podeEditar"
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text p-button-info mr-2"
            @click="$router.push(`/estoque/produtos/${slotProps.data.id}`)"
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
import StockProductService from '@/service/StockProductService';

export default {
  name: 'ProdutosList',
  setup() {
    const toast = useToast();
    const store = useStore();
    const permissionService = new PermissionsService();
    const produtos = ref([]);
    const filtroGlobal = ref('');
    const carregando = ref(false);
    const service = new StockProductService();

    // Verificar permissões
    const podeCriar = computed(() => permissionService.hasPermissions('view_estoque_produtos_create'));
    const podeVisualizar = computed(() => permissionService.hasPermissions('view_estoque_produtos'));
    const podeEditar = computed(() => permissionService.hasPermissions('view_estoque_produtos_edit'));
    const podeDeletar = computed(() => permissionService.hasPermissions('view_estoque_produtos_delete'));

    const produtosFiltrados = computed(() => {
      if (!filtroGlobal.value) return produtos.value;
      const filtro = filtroGlobal.value.toLowerCase();
      return produtos.value.filter(p =>
        p.code?.toLowerCase().includes(filtro) ||
        p.reference?.toLowerCase().includes(filtro) ||
        p.description?.toLowerCase().includes(filtro)
      );
    });

    const carregar = async () => {
      try {
        carregando.value = true;
        const { data } = await service.getAll({ per_page: 100 });
        produtos.value = data.data || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar produtos', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };

    const toggleActive = async (produto) => {
      try {
        await service.toggleActive(produto.id);
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
      produtos,
      filtroGlobal,
      produtosFiltrados,
      carregando,
      toggleActive,
      podeCriar,
      podeVisualizar,
      podeEditar,
      podeDeletar,
    };
  },
};
</script>

