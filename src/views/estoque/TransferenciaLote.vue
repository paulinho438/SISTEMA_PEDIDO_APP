<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-4">
      <h5 class="text-900 m-0">Transferência entre Locais</h5>
      <div class="flex gap-2">
        <Button 
          label="Gerar Documento" 
          icon="pi pi-file-pdf" 
          class="p-button-success"
          :disabled="itensSelecionados.length === 0 || !localDestino"
          @click="gerarDocumento"
          :loading="gerandoDocumento"
        />
      </div>
    </div>

    <div class="grid mb-3">
      <div class="col-12 md:col-6">
        <label for="localOrigem">Local de Origem *</label>
        <Dropdown
          id="localOrigem"
          v-model="localOrigem"
          :options="locaisDisponiveis"
          optionLabel="name"
          optionValue="id"
          placeholder="Selecione o local de origem"
          class="w-full"
          :filter="true"
          @change="carregarEstoques"
        />
      </div>
      <div class="col-12 md:col-6">
        <label for="localDestino">Local de Destino *</label>
        <Dropdown
          id="localDestino"
          v-model="localDestino"
          :options="locaisDestino"
          optionLabel="name"
          optionValue="id"
          placeholder="Selecione o local de destino"
          class="w-full"
          :filter="true"
          :disabled="!localOrigem"
        />
      </div>
    </div>

    <div class="grid mb-3">
      <div class="col-12">
        <label for="observacao">Observação</label>
        <Textarea 
          id="observacao"
          v-model="observacao" 
          rows="2" 
          class="w-full" 
          placeholder="Informe observações sobre esta transferência..." 
        />
      </div>
    </div>

    <div class="grid">
      <!-- Coluna Esquerda: Itens Disponíveis -->
      <div class="col-12 lg:col-7">
        <div class="card">
          <div class="flex justify-content-between align-items-center mb-3">
            <h6 class="m-0">Itens Disponíveis</h6>
            <span class="text-sm text-500">{{ estoques.length }} item(s)</span>
          </div>
          
          <div class="mb-3">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search" />
              <InputText 
                v-model="filtroBusca" 
                placeholder="Buscar por código, descrição ou local..." 
                class="w-full"
                @input="aplicarFiltro"
              />
            </span>
          </div>

          <DataTable
            :value="estoquesFiltrados"
            :loading="carregandoEstoques"
            :paginator="true"
            :rows="20"
            dataKey="id"
            responsiveLayout="scroll"
            class="p-datatable-sm"
            :selection.sync="selecaoEstoques"
            selectionMode="multiple"
            :selectAll="false"
            @rowSelect="onRowSelect"
            @rowUnselect="onRowUnselect"
            @selectAllChange="onSelectAll"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            <Column field="product.code" header="Código" sortable>
              <template #body="slotProps">
                {{ slotProps.data.product?.code || '-' }}
              </template>
            </Column>
            <Column field="product.description" header="Descrição" sortable>
              <template #body="slotProps">
                {{ slotProps.data.product?.description || '-' }}
              </template>
            </Column>
            <Column field="location.name" header="Local" sortable>
              <template #body="slotProps">
                {{ slotProps.data.location?.name || '-' }}
              </template>
            </Column>
            <Column field="quantity_available" header="Disponível" sortable>
              <template #body="slotProps">
                <span class="font-semibold text-green-600">
                  {{ formatarQuantidade(slotProps.data.quantity_available) }}
                </span>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <!-- Coluna Direita: Itens Selecionados -->
      <div class="col-12 lg:col-5">
        <div class="card">
          <div class="flex justify-content-between align-items-center mb-3">
            <h6 class="m-0">Itens Selecionados</h6>
            <Badge :value="itensSelecionados.length" severity="info" />
          </div>

          <div v-if="itensSelecionados.length === 0" class="text-center text-500 py-4">
            Nenhum item selecionado
          </div>

          <div v-else class="flex flex-column gap-2">
            <div 
              v-for="(item, index) in itensSelecionados" 
              :key="item.id"
              class="p-3 border-round surface-border border-1"
            >
              <div class="flex justify-content-between align-items-start mb-2">
                <div class="flex-1">
                  <div class="font-semibold text-sm">{{ item.product?.code || '-' }}</div>
                  <div class="text-sm text-500">{{ item.product?.description || '-' }}</div>
                  <div class="text-xs text-500 mt-1">
                    Disponível: {{ formatarQuantidade(item.quantity_available) }}
                  </div>
                </div>
                <Button 
                  icon="pi pi-times" 
                  class="p-button-text p-button-danger p-button-sm"
                  @click="removerItem(index)"
                  v-tooltip.top="'Remover'"
                />
              </div>
              
              <div class="mt-2">
                <label class="text-xs text-600">Quantidade a Transferir *</label>
                <InputNumber
                  v-model="item.quantidade"
                  :min="0.0001"
                  :max="item.quantity_available"
                  :step="0.0001"
                  class="w-full"
                  :useGrouping="false"
                  @input="validarQuantidade(item)"
                />
                <small class="text-500 text-xs">
                  Máx: {{ formatarQuantidade(item.quantity_available) }}
                </small>
              </div>
            </div>

            <div class="mt-3 pt-3 border-top-1 surface-border">
              <div class="flex justify-content-between mb-2">
                <span class="font-semibold">Total de Itens:</span>
                <span class="font-semibold">{{ itensSelecionados.length }}</span>
              </div>
              <div class="flex justify-content-between">
                <span class="font-semibold">Quantidade Total:</span>
                <span class="font-semibold text-green-600">
                  {{ formatarQuantidade(quantidadeTotal) }}
                </span>
              </div>
            </div>

            <Button
              label="Confirmar Transferência"
              icon="pi pi-check"
              class="p-button-success w-full mt-3"
              :disabled="!podeConfirmar"
              :loading="processandoTransferencia"
              @click="confirmarTransferencia"
            />
          </div>
        </div>
      </div>
    </div>

    <Toast />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import PermissionsService from '@/service/PermissionsService';
import StockService from '@/service/StockService';
import StockLocationService from '@/service/StockLocationService';
import StockMovementService from '@/service/StockMovementService';

export default {
  name: 'TransferenciaLote',
  setup() {
    const toast = useToast();
    const permissionService = new PermissionsService();
    const stockService = new StockService();
    const locationService = new StockLocationService();
    const movementService = new StockMovementService();

    const localOrigem = ref(null);
    const localDestino = ref(null);
    const observacao = ref('');
    const locaisDisponiveis = ref([]);
    const locaisDestino = ref([]);
    const estoques = ref([]);
    const estoquesFiltrados = ref([]);
    const selecaoEstoques = ref([]);
    const itensSelecionados = ref([]);
    const filtroBusca = ref('');
    const carregandoEstoques = ref(false);
    const processandoTransferencia = ref(false);
    const gerandoDocumento = ref(false);

    const podeConfirmar = computed(() => {
      if (!localOrigem.value || !localDestino.value || localOrigem.value === localDestino.value) {
        return false;
      }
      if (itensSelecionados.value.length === 0) {
        return false;
      }
      return itensSelecionados.value.every(item => 
        item.quantidade && 
        item.quantidade > 0 && 
        item.quantidade <= item.quantity_available
      );
    });

    const quantidadeTotal = computed(() => {
      return itensSelecionados.value.reduce((total, item) => {
        return total + (parseFloat(item.quantidade) || 0);
      }, 0);
    });

    const formatarQuantidade = (qtd) => {
      if (!qtd) return '0,0000';
      return parseFloat(qtd).toLocaleString('pt-BR', { 
        minimumFractionDigits: 4, 
        maximumFractionDigits: 4 
      });
    };

    const carregarLocais = async () => {
      try {
        const [disponiveis, todos] = await Promise.all([
          locationService.getAll({ per_page: 100 }),
          locationService.getAllActive({ per_page: 100 })
        ]);
        locaisDisponiveis.value = disponiveis?.data?.data || [];
        locaisDestino.value = todos?.data?.data || [];
      } catch (error) {
        console.error('Erro ao carregar locais:', error);
        toast.add({ 
          severity: 'error', 
          summary: 'Erro', 
          detail: 'Erro ao carregar locais', 
          life: 3000 
        });
      }
    };

    const carregarEstoques = async () => {
      if (!localOrigem.value) {
        estoques.value = [];
        estoquesFiltrados.value = [];
        return;
      }

      try {
        carregandoEstoques.value = true;
        const response = await stockService.getAll({ 
          location_id: localOrigem.value,
          has_available: true,
          per_page: 1000
        });
        
        const data = response?.data?.data || response?.data || [];
        estoques.value = Array.isArray(data) ? data : [];
        aplicarFiltro();
      } catch (error) {
        console.error('Erro ao carregar estoques:', error);
        toast.add({ 
          severity: 'error', 
          summary: 'Erro', 
          detail: 'Erro ao carregar estoques', 
          life: 3000 
        });
      } finally {
        carregandoEstoques.value = false;
      }
    };

    const aplicarFiltro = () => {
      if (!filtroBusca.value || filtroBusca.value.trim() === '') {
        estoquesFiltrados.value = estoques.value;
        return;
      }

      const busca = filtroBusca.value.toLowerCase().trim();
      estoquesFiltrados.value = estoques.value.filter(estoque => {
        const codigo = estoque.product?.code?.toLowerCase() || '';
        const descricao = estoque.product?.description?.toLowerCase() || '';
        const local = estoque.location?.name?.toLowerCase() || '';
        return codigo.includes(busca) || descricao.includes(busca) || local.includes(busca);
      });
    };

    const onRowSelect = (event) => {
      const estoque = event.data;
      // Verificar se já está selecionado
      if (!itensSelecionados.value.find(item => item.id === estoque.id)) {
        itensSelecionados.value.push({
          ...estoque,
          quantidade: Math.min(1, estoque.quantity_available)
        });
      }
    };

    const onRowUnselect = (event) => {
      const estoque = event.data;
      const index = itensSelecionados.value.findIndex(item => item.id === estoque.id);
      if (index !== -1) {
        itensSelecionados.value.splice(index, 1);
      }
    };

    const onSelectAll = (event) => {
      if (event.checked) {
        estoquesFiltrados.value.forEach(estoque => {
          if (!itensSelecionados.value.find(item => item.id === estoque.id)) {
            itensSelecionados.value.push({
              ...estoque,
              quantidade: Math.min(1, estoque.quantity_available)
            });
          }
        });
      } else {
        estoquesFiltrados.value.forEach(estoque => {
          const index = itensSelecionados.value.findIndex(item => item.id === estoque.id);
          if (index !== -1) {
            itensSelecionados.value.splice(index, 1);
          }
        });
      }
    };

    const removerItem = (index) => {
      const item = itensSelecionados.value[index];
      itensSelecionados.value.splice(index, 1);
      
      // Remover da seleção da tabela
      const indexSelecao = selecaoEstoques.value.findIndex(e => e.id === item.id);
      if (indexSelecao !== -1) {
        selecaoEstoques.value.splice(indexSelecao, 1);
      }
    };

    const validarQuantidade = (item) => {
      if (item.quantidade > item.quantity_available) {
        item.quantidade = item.quantity_available;
        toast.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Quantidade não pode ser maior que o disponível',
          life: 2000
        });
      }
      if (item.quantidade < 0.0001) {
        item.quantidade = 0.0001;
      }
    };

    const confirmarTransferencia = async () => {
      if (!podeConfirmar.value) {
        return;
      }

      try {
        processandoTransferencia.value = true;

        const dados = {
          local_origem_id: localOrigem.value,
          local_destino_id: localDestino.value,
          observacao: observacao.value || null,
          itens: itensSelecionados.value.map(item => ({
            stock_id: item.id,
            quantidade: item.quantidade,
          }))
        };

        const response = await movementService.transferirLote(dados);
        
        const sucessos = response?.data?.data?.sucessos || 0;
        const falhas = response?.data?.data?.falhas || 0;

        if (sucessos > 0) {
          toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: response?.data?.message || `${sucessos} item(ns) transferido(s) com sucesso${falhas > 0 ? `. ${falhas} falha(s).` : '.'}`,
            life: 5000
          });
        }

        if (falhas > 0) {
          toast.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: `${falhas} item(ns) não puderam ser transferidos. Verifique os detalhes.`,
            life: 5000
          });
        }

        // Limpar seleção e recarregar
        itensSelecionados.value = [];
        selecaoEstoques.value = [];
        await carregarEstoques();
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao processar transferências',
          life: 3000
        });
      } finally {
        processandoTransferencia.value = false;
      }
    };

    const gerarDocumento = async () => {
      if (itensSelecionados.value.length === 0 || !localDestino.value) {
        return;
      }

      try {
        gerandoDocumento.value = true;

        const localOrigemObj = locaisDisponiveis.value.find(l => l.id === localOrigem.value);
        const localDestinoObj = locaisDestino.value.find(l => l.id === localDestino.value);

        const dados = {
          local_origem_id: localOrigem.value,
          local_destino_id: localDestino.value,
          observacao: observacao.value || null,
          itens: itensSelecionados.value.map(item => ({
            stock_id: item.id,
            product_id: item.stock_product_id,
            codigo: item.product?.code,
            referencia: item.product?.reference,
            descricao: item.product?.description,
            quantidade: item.quantidade,
            quantidade_disponivel: item.quantity_available,
          }))
        };

        // Chamar endpoint para gerar PDF
        const apiPath = import.meta.env.VITE_APP_BASE_URL;
        const response = await fetch(`${apiPath}/estoque/transferencias/gerar-documento`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'company-id': localStorage.getItem('company-id') || '',
          },
          body: JSON.stringify(dados)
        });

        if (!response.ok) {
          throw new Error('Erro ao gerar documento');
        }

        // Criar blob e fazer download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transferencia-${localOrigemObj?.code || localOrigem.value}-${localDestinoObj?.code || localDestino.value}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Documento gerado com sucesso!',
          life: 3000
        });
      } catch (error) {
        console.error('Erro ao gerar documento:', error);
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao gerar documento',
          life: 3000
        });
      } finally {
        gerandoDocumento.value = false;
      }
    };

    // Watch para atualizar filtro quando busca mudar
    watch(filtroBusca, () => {
      aplicarFiltro();
    });

    onMounted(() => {
      carregarLocais();
    });

    return {
      localOrigem,
      localDestino,
      observacao,
      locaisDisponiveis,
      locaisDestino,
      estoques,
      estoquesFiltrados,
      selecaoEstoques,
      itensSelecionados,
      filtroBusca,
      carregandoEstoques,
      processandoTransferencia,
      gerandoDocumento,
      podeConfirmar,
      quantidadeTotal,
      formatarQuantidade,
      carregarEstoques,
      aplicarFiltro,
      onRowSelect,
      onRowUnselect,
      onSelectAll,
      removerItem,
      validarQuantidade,
      confirmarTransferencia,
      gerarDocumento,
    };
  },
};
</script>

<style scoped>
.p-datatable-sm {
  font-size: 0.875rem;
}
</style>

