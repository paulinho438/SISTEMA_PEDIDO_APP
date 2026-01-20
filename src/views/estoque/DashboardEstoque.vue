<template>
  <div class="grid">
    <!-- Cards de Resumo -->
    <div class="col-12 md:col-3">
      <div class="card">
        <div class="flex align-items-center justify-content-between">
          <div>
            <span class="block text-500 font-medium mb-3">Total de Produtos</span>
            <div class="text-900 font-bold text-3xl">{{ metrics.total_products || 0 }}</div>
          </div>
          <div class="flex align-items-center justify-content-center bg-blue-100 border-round" style="width:2.5rem;height:2.5rem">
            <i class="pi pi-box text-blue-500 text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 md:col-3">
      <div class="card">
        <div class="flex align-items-center justify-content-between">
          <div>
            <span class="block text-500 font-medium mb-3">Produtos com Estoque Baixo</span>
            <div class="text-900 font-bold text-3xl">{{ metrics.total_low_stock || 0 }}</div>
          </div>
          <div class="flex align-items-center justify-content-center bg-orange-100 border-round" style="width:2.5rem;height:2.5rem">
            <i class="pi pi-exclamation-triangle text-orange-500 text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 md:col-3">
      <div class="card">
        <div class="flex align-items-center justify-content-between">
          <div>
            <span class="block text-500 font-medium mb-3">Produtos Sem Estoque</span>
            <div class="text-900 font-bold text-3xl">{{ metrics.out_of_stock_products?.length || 0 }}</div>
          </div>
          <div class="flex align-items-center justify-content-center bg-red-100 border-round" style="width:2.5rem;height:2.5rem">
            <i class="pi pi-times-circle text-red-500 text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="col-12 md:col-3">
      <div class="card">
        <div class="flex align-items-center justify-content-between">
          <div>
            <span class="block text-500 font-medium mb-3">Produtos Próximos do Mínimo</span>
            <div class="text-900 font-bold text-3xl">{{ metrics.low_stock_products?.length || 0 }}</div>
          </div>
          <div class="flex align-items-center justify-content-center bg-yellow-100 border-round" style="width:2.5rem;height:2.5rem">
            <i class="pi pi-info-circle text-yellow-500 text-xl"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- Produtos Sem Estoque -->
    <div class="col-12 lg:col-6">
      <div class="card">
        <h5 class="mb-3">Produtos Sem Estoque</h5>
        <DataTable 
          :value="metrics.out_of_stock_products || []" 
          :loading="loading"
          :paginator="true"
          :rows="10"
          responsiveLayout="scroll"
          class="p-datatable-sm"
        >
          <Column field="code" header="Código" sortable></Column>
          <Column field="description" header="Descrição" sortable></Column>
          <Column field="min_stock" header="Mínimo" sortable>
            <template #body="slotProps">
              {{ formatNumber(slotProps.data.min_stock) }} {{ slotProps.data.unit }}
            </template>
          </Column>
          <Column field="current_stock" header="Atual" sortable>
            <template #body="slotProps">
              <span class="text-red-500 font-bold">{{ formatNumber(slotProps.data.current_stock) }} {{ slotProps.data.unit }}</span>
            </template>
          </Column>
          <Column header="Ações">
            <template #body="slotProps">
              <Button
                icon="pi pi-eye"
                class="p-button-rounded p-button-text p-button-info"
                @click="$router.push(`/estoque/produtos/${slotProps.data.id}?view=true`)"
                v-tooltip.top="'Visualizar'"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Produtos com Estoque Baixo -->
    <div class="col-12 lg:col-6">
      <div class="card">
        <h5 class="mb-3">Produtos Próximos do Mínimo</h5>
        <DataTable 
          :value="metrics.low_stock_products || []" 
          :loading="loading"
          :paginator="true"
          :rows="10"
          responsiveLayout="scroll"
          class="p-datatable-sm"
        >
          <Column field="code" header="Código" sortable></Column>
          <Column field="description" header="Descrição" sortable></Column>
          <Column field="current_stock" header="Atual" sortable>
            <template #body="slotProps">
              {{ formatNumber(slotProps.data.current_stock) }} {{ slotProps.data.unit }}
            </template>
          </Column>
          <Column field="min_stock" header="Mínimo" sortable>
            <template #body="slotProps">
              {{ formatNumber(slotProps.data.min_stock) }} {{ slotProps.data.unit }}
            </template>
          </Column>
          <Column field="percentage" header="%" sortable>
            <template #body="slotProps">
              <ProgressBar :value="slotProps.data.percentage" :showValue="true" />
            </template>
          </Column>
          <Column header="Ações">
            <template #body="slotProps">
              <Button
                icon="pi pi-eye"
                class="p-button-rounded p-button-text p-button-info"
                @click="$router.push(`/estoque/produtos/${slotProps.data.id}?view=true`)"
                v-tooltip.top="'Visualizar'"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <Toast />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import DashboardService from '@/service/DashboardService';

export default {
  name: 'DashboardEstoque',
  setup() {
    const toast = useToast();
    const dashboardService = new DashboardService();
    const loading = ref(false);
    const metrics = ref({
      total_products: 0,
      low_stock_products: [],
      out_of_stock_products: [],
      total_low_stock: 0,
      total_value: 0,
    });

    const formatNumber = (value) => {
      if (value === null || value === undefined) return '0';
      return parseInt(value).toLocaleString('pt-BR');
    };

    const carregarDados = async () => {
      try {
        loading.value = true;
        const { data } = await dashboardService.getStockMetrics();
        metrics.value = data;
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao carregar dados do dashboard',
          life: 4000,
        });
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      carregarDados();
    });

    return {
      loading,
      metrics,
      formatNumber,
    };
  },
};
</script>

