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
          :totalRecords="(metrics.out_of_stock_products || []).length"
          responsiveLayout="scroll"
          class="p-datatable-sm"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} produtos"
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
          <Column field="low_locations" header="Locais com Estoque Baixo" v-if="hasLowLocations">
            <template #body="slotProps">
              <div v-if="slotProps.data.low_locations && slotProps.data.low_locations.length > 0">
                <Tag 
                  v-for="(loc, idx) in slotProps.data.low_locations" 
                  :key="idx"
                  :value="`${loc.location_name}: ${formatNumber(loc.quantity)}`"
                  severity="warning"
                  class="mr-1 mb-1"
                />
              </div>
              <span v-else class="text-500">-</span>
            </template>
          </Column>
          <Column header="Ações">
            <template #body="slotProps">
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-text p-button-warning"
                @click="abrirModalAjuste(slotProps.data)"
                v-tooltip.top="'Ajustar Estoque'"
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
          :totalRecords="(metrics.low_stock_products || []).length"
          responsiveLayout="scroll"
          class="p-datatable-sm"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} produtos"
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
          <Column field="low_locations" header="Locais com Estoque Baixo" v-if="hasLowLocations">
            <template #body="slotProps">
              <div v-if="slotProps.data.low_locations && slotProps.data.low_locations.length > 0">
                <Tag 
                  v-for="(loc, idx) in slotProps.data.low_locations" 
                  :key="idx"
                  :value="`${loc.location_name}: ${formatNumber(loc.quantity)}`"
                  severity="warning"
                  class="mr-1 mb-1"
                />
              </div>
              <span v-else class="text-500">-</span>
            </template>
          </Column>
          <Column header="Ações">
            <template #body="slotProps">
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-text p-button-warning"
                @click="abrirModalAjuste(slotProps.data)"
                v-tooltip.top="'Ajustar Estoque'"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Histórico de Movimentações -->
    <div class="col-12">
      <div class="card">
        <h5 class="mb-3">Últimas Movimentações</h5>
        <DataTable 
          :value="metrics.recent_movements || []" 
          :loading="loading"
          responsiveLayout="scroll"
          class="p-datatable-sm"
          :paginator="false"
        >
          <Column field="movement_date" header="Data" sortable>
            <template #body="slotProps">
              {{ formatDate(slotProps.data.movement_date) }}
            </template>
          </Column>
          <Column field="product_description" header="Produto" sortable>
            <template #body="slotProps">
              <div>
                <div class="font-semibold">{{ slotProps.data.product_code }}</div>
                <div class="text-sm text-500">{{ slotProps.data.product_description }}</div>
              </div>
            </template>
          </Column>
          <Column field="location_name" header="Local" sortable>
            <template #body="slotProps">
              {{ slotProps.data.location_name || '-' }}
            </template>
          </Column>
          <Column field="movement_type" header="Tipo" sortable>
            <template #body="slotProps">
              <Tag :value="formatMovementType(slotProps.data.movement_type)" :severity="getSeverityType(slotProps.data.movement_type)" />
            </template>
          </Column>
          <Column field="quantity" header="Quantidade" sortable>
            <template #body="slotProps">
              {{ formatQuantity(slotProps.data.quantity) }}
            </template>
          </Column>
          <Column field="user_name" header="Usuário" sortable>
            <template #body="slotProps">
              {{ slotProps.data.user_name || '-' }}
            </template>
          </Column>
          <Column field="observation" header="Observação" sortable>
            <template #body="slotProps">
              <span class="text-500">{{ slotProps.data.observation || '-' }}</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Modal de Ajuste Manual -->
    <Dialog v-model:visible="modalAjuste.visivel" modal header="Ajuste Manual de Estoque" :style="{ width: '600px' }" appendTo="body">
      <div class="mb-4">
        <div class="mb-3">
          <label class="block text-600 mb-2">Produto e Local *</label>
          <AutoComplete
            v-model="modalAjuste.estoque"
            :suggestions="sugestoesEstoque"
            @complete="buscarEstoque($event)"
            optionLabel="label"
            placeholder="Buscar produto no local..."
            class="w-full"
            dropdown
            forceSelection
          >
            <template #item="slotProps">
              <div class="flex flex-column">
                <div class="font-semibold">{{ slotProps.item.product_description }}</div>
                <div class="text-sm text-500">Local: {{ slotProps.item.location_name }}</div>
                <div class="text-sm text-green-600">Disponível: {{ slotProps.item.quantity_available }}</div>
              </div>
            </template>
          </AutoComplete>
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Tipo de Ajuste *</label>
          <Dropdown
            v-model="modalAjuste.tipo"
            :options="tiposAjuste"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecione o tipo"
            class="w-full"
            :disabled="!modalAjuste.estoque"
          />
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Quantidade *</label>
          <InputNumber
            v-model="modalAjuste.quantidade"
            :min="0.0001"
            :max="modalAjuste.tipo === 'saida' ? (modalAjuste.estoque?.quantity_available || 0) : null"
            :step="0.0001"
            class="w-full"
            :useGrouping="false"
            :disabled="!modalAjuste.estoque || !modalAjuste.tipo"
          />
          <small v-if="modalAjuste.estoque && modalAjuste.tipo === 'saida'" class="text-500">
            Máximo disponível: {{ modalAjuste.estoque.quantity_available }}
          </small>
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Custo Unitário (opcional)</label>
          <InputNumber
            v-model="modalAjuste.custo"
            :min="0"
            :step="0.01"
            class="w-full"
            :useGrouping="false"
            mode="decimal"
          />
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Observação</label>
          <Textarea v-model="modalAjuste.observacao" rows="3" class="w-full" placeholder="Informe observações sobre este ajuste..." />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-content-end gap-2">
          <Button label="Cancelar" class="p-button-text" @click="fecharModalAjuste" />
          <Button
            label="Aplicar Ajuste"
            icon="pi pi-check"
            class="p-button-warning"
            :disabled="!modalAjuste.estoque || !modalAjuste.tipo || !modalAjuste.quantidade"
            :loading="modalAjuste.loading"
            @click="confirmarAjuste"
          />
        </div>
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import DashboardService from '@/service/DashboardService';
import StockMovementService from '@/service/StockMovementService';
import StockService from '@/service/StockService';

export default {
  name: 'DashboardEstoque',
  setup() {
    const toast = useToast();
    const dashboardService = new DashboardService();
    const movementService = new StockMovementService();
    const stockService = new StockService();
    const loading = ref(false);
    const metrics = ref({
      total_products: 0,
      low_stock_products: [],
      out_of_stock_products: [],
      total_low_stock: 0,
      total_value: 0,
      recent_movements: [],
    });

    const modalAjuste = reactive({
      visivel: false,
      estoque: null,
      tipo: null,
      quantidade: null,
      custo: null,
      observacao: '',
      loading: false,
      produtoId: null,
    });

    const sugestoesEstoque = ref([]);
    let timeoutBuscaEstoque = null;

    const tiposAjuste = [
      { label: 'Entrada', value: 'entrada' },
      { label: 'Saída', value: 'saida' },
      { label: 'Ajuste', value: 'ajuste' },
    ];

    const formatNumber = (value) => {
      if (value === null || value === undefined) return '0';
      return parseInt(value).toLocaleString('pt-BR');
    };

    const formatDate = (date) => {
      if (!date) return '-';
      try {
        const d = new Date(date);
        return d.toLocaleDateString('pt-BR');
      } catch (e) {
        return date;
      }
    };

    const formatQuantity = (value) => {
      if (value === null || value === undefined) return '0';
      return parseFloat(value).toLocaleString('pt-BR', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      });
    };

    const formatMovementType = (type) => {
      const types = {
        'entrada': 'Entrada',
        'saida': 'Saída',
        'ajuste': 'Ajuste',
        'transferencia': 'Transferência',
      };
      return types[type] || type;
    };

    const getSeverityType = (type) => {
      const map = {
        'entrada': 'success',
        'saida': 'danger',
        'ajuste': 'warning',
        'transferencia': 'info',
      };
      return map[type] || 'secondary';
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

    const hasLowLocations = computed(() => {
      const outOfStock = metrics.value.out_of_stock_products || [];
      const lowStock = metrics.value.low_stock_products || [];
      const allProducts = [...outOfStock, ...lowStock];
      return allProducts.some(p => p.low_locations && p.low_locations.length > 0);
    });

    const abrirModalAjuste = async (produto) => {
      modalAjuste.visivel = true;
      modalAjuste.estoque = null;
      modalAjuste.tipo = null;
      modalAjuste.quantidade = null;
      modalAjuste.custo = null;
      modalAjuste.observacao = '';
      modalAjuste.produtoId = produto.id;
      
      // Buscar estoques do produto
      if (produto.id) {
        try {
          const response = await stockService.getAll({ 
            stock_product_id: produto.id,
            per_page: 100 
          });
          const data = response?.data?.data ?? response?.data ?? [];
          
          sugestoesEstoque.value = Array.isArray(data) ? data.map(item => ({
            ...item,
            label: `${item.product?.description || produto.description || ''} - ${item.location?.name || ''}`,
            product_description: item.product?.description || produto.description || '',
            location_name: item.location?.name || '',
          })) : [];
          
          // Se houver apenas um estoque, selecionar automaticamente
          if (sugestoesEstoque.value.length === 1) {
            modalAjuste.estoque = sugestoesEstoque.value[0];
          }
        } catch (error) {
          console.error('Erro ao buscar estoques do produto:', error);
          sugestoesEstoque.value = [];
        }
      }
    };

    const fecharModalAjuste = () => {
      modalAjuste.visivel = false;
      modalAjuste.estoque = null;
      modalAjuste.tipo = null;
      modalAjuste.quantidade = null;
      modalAjuste.custo = null;
      modalAjuste.observacao = '';
      modalAjuste.produtoId = null;
      sugestoesEstoque.value = [];
    };

    const buscarEstoque = async (event) => {
      const query = event.query;
      
      if (!query || query.length < 2) {
        // Se não há query, mas temos produtoId, buscar estoques do produto
        if (modalAjuste.produtoId) {
          try {
            const response = await stockService.getAll({ 
              stock_product_id: modalAjuste.produtoId,
              per_page: 100 
            });
            const data = response?.data?.data ?? response?.data ?? [];
            
            sugestoesEstoque.value = Array.isArray(data) ? data.map(item => ({
              ...item,
              label: `${item.product?.description || ''} - ${item.location?.name || ''}`,
              product_description: item.product?.description || '',
              location_name: item.location?.name || '',
            })) : [];
          } catch (error) {
            console.error('Erro ao buscar estoques:', error);
            sugestoesEstoque.value = [];
          }
        } else {
          sugestoesEstoque.value = [];
        }
        return;
      }

      if (timeoutBuscaEstoque) {
        clearTimeout(timeoutBuscaEstoque);
      }

      timeoutBuscaEstoque = setTimeout(async () => {
        try {
          const params = { search: query, per_page: 20 };
          // Se temos produtoId, filtrar por produto também
          if (modalAjuste.produtoId) {
            params.stock_product_id = modalAjuste.produtoId;
          }
          
          const response = await stockService.getAll(params);
          const data = response?.data?.data ?? response?.data ?? [];
          
          sugestoesEstoque.value = Array.isArray(data) ? data.map(item => ({
            ...item,
            label: `${item.product?.description || ''} - ${item.location?.name || ''}`,
            product_description: item.product?.description || '',
            location_name: item.location?.name || '',
          })) : [];
        } catch (error) {
          console.error('Erro ao buscar estoque:', error);
          sugestoesEstoque.value = [];
        }
      }, 300);
    };

    const confirmarAjuste = async () => {
      if (!modalAjuste.estoque || !modalAjuste.tipo || !modalAjuste.quantidade) {
        return;
      }

      try {
        modalAjuste.loading = true;

        const dados = {
          stock_id: modalAjuste.estoque.id,
          movement_type: modalAjuste.tipo,
          quantity: modalAjuste.quantidade,
          cost: modalAjuste.custo || null,
          observation: modalAjuste.observacao || null,
        };

        await movementService.ajuste(dados);

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Ajuste realizado com sucesso!',
          life: 3000
        });

        fecharModalAjuste();
        await carregarDados();
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao realizar ajuste',
          life: 3000
        });
      } finally {
        modalAjuste.loading = false;
      }
    };

    onMounted(() => {
      carregarDados();
    });

    return {
      loading,
      metrics,
      formatNumber,
      formatDate,
      formatQuantity,
      formatMovementType,
      getSeverityType,
      hasLowLocations,
      modalAjuste,
      tiposAjuste,
      sugestoesEstoque,
      abrirModalAjuste,
      fecharModalAjuste,
      buscarEstoque,
      confirmarAjuste,
    };
  },
};
</script>

