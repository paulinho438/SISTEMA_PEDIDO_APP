<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 m-0">Controle de Transferências</h5>
    </div>

    <div class="grid mb-3">
      <div class="col-12 md:col-3">
        <label for="status">Status</label>
        <Dropdown
          id="status"
          v-model="filtros.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos"
          class="w-full"
          showClear
        />
      </div>
      <div class="col-12 md:col-3">
        <label for="localOrigem">Local de Origem</label>
        <Dropdown
          id="localOrigem"
          v-model="filtros.local_origem_id"
          :options="locais"
          optionLabel="name"
          optionValue="id"
          placeholder="Todos"
          class="w-full"
          :filter="true"
          showClear
        />
      </div>
      <div class="col-12 md:col-3">
        <label for="localDestino">Local de Destino</label>
        <Dropdown
          id="localDestino"
          v-model="filtros.local_destino_id"
          :options="locais"
          optionLabel="name"
          optionValue="id"
          placeholder="Todos"
          class="w-full"
          :filter="true"
          showClear
        />
      </div>
      <div class="col-12 md:col-3">
        <label>&nbsp;</label>
        <Button label="Filtrar" icon="pi pi-filter" class="w-full mt-2" @click="carregar" />
      </div>
    </div>

    <DataTable
      :value="transferencias"
      :paginator="true"
      :rows="10"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
    >
      <Column field="transfer_number" header="Número" sortable></Column>
      <Column field="origin_location.name" header="Origem" sortable>
        <template #body="slotProps">
          {{ slotProps.data.origin_location?.name || '-' }}
        </template>
      </Column>
      <Column field="destination_location.name" header="Destino" sortable>
        <template #body="slotProps">
          {{ slotProps.data.destination_location?.name || '-' }}
        </template>
      </Column>
      <Column field="driver_name" header="Motorista" sortable>
        <template #body="slotProps">
          {{ slotProps.data.driver_name || '-' }}
        </template>
      </Column>
      <Column field="license_plate" header="Placa" sortable>
        <template #body="slotProps">
          {{ slotProps.data.license_plate || '-' }}
        </template>
      </Column>
      <Column field="status" header="Status" sortable>
        <template #body="slotProps">
          <Tag 
            :value="slotProps.data.status_label" 
            :severity="getSeverityStatus(slotProps.data.status)" 
          />
        </template>
      </Column>
      <Column field="items_count" header="Itens" sortable>
        <template #body="slotProps">
          {{ slotProps.data.items_count || 0 }}
        </template>
      </Column>
      <Column field="total_quantity" header="Qtd. Total" sortable>
        <template #body="slotProps">
          {{ formatarQuantidade(slotProps.data.total_quantity) }}
        </template>
      </Column>
      <Column field="created_at" header="Data" sortable>
        <template #body="slotProps">
          {{ formatarData(slotProps.data.created_at) }}
        </template>
      </Column>
      <Column header="Ações" :exportable="false">
        <template #body="slotProps">
          <div class="flex gap-1">
            <Button
              icon="pi pi-file-pdf"
              class="p-button-rounded p-button-text p-button-info p-button-sm"
              v-tooltip.top="'Imprimir Documento'"
              @click="imprimirDocumento(slotProps.data.id)"
            />
            <Button
              v-if="slotProps.data.status === 'pendente'"
              icon="pi pi-check"
              class="p-button-rounded p-button-text p-button-success p-button-sm"
              v-tooltip.top="'Marcar como Recebido'"
              @click="marcarRecebido(slotProps.data.id)"
              :loading="processando === slotProps.data.id"
            />
            <Button
              v-if="slotProps.data.status === 'pendente'"
              icon="pi pi-trash"
              class="p-button-rounded p-button-text p-button-danger p-button-sm"
              v-tooltip.top="'Excluir Transferência'"
              @click="confirmarExclusao(slotProps.data.id)"
              :loading="processando === slotProps.data.id"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Modal de Recebimento -->
    <Dialog 
      v-model:visible="modalRecebimento.visivel" 
      modal 
      header="Marcar como Recebido" 
      :style="{ width: '700px' }" 
      appendTo="body"
    >
      <div v-if="modalRecebimento.carregando" class="text-center p-5">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <p class="mt-3">Carregando...</p>
      </div>
      
      <div v-else>
        <div class="mb-4">
          <label class="block text-600 mb-2">Tipo de Recebimento *</label>
          <div class="flex gap-3">
            <div class="flex align-items-center">
              <RadioButton 
                id="recebimentoTotal" 
                v-model="modalRecebimento.tipo" 
                value="total" 
                inputId="recebimentoTotal"
              />
              <label for="recebimentoTotal" class="ml-2">Total</label>
            </div>
            <div class="flex align-items-center">
              <RadioButton 
                id="recebimentoParcial" 
                v-model="modalRecebimento.tipo" 
                value="parcial" 
                inputId="recebimentoParcial"
              />
              <label for="recebimentoParcial" class="ml-2">Parcial</label>
            </div>
          </div>
        </div>

        <div v-if="modalRecebimento.tipo === 'parcial'" class="mb-4">
          <label class="block text-600 mb-2">Selecione os itens recebidos:</label>
          <DataTable 
            :value="modalRecebimento.itens" 
            class="p-datatable-sm"
            :scrollable="true"
            scrollHeight="300px"
          >
            <Column>
              <template #header>
                <Checkbox 
                  v-model="modalRecebimento.todosSelecionados"
                  :binary="true"
                  @change="toggleTodosItens"
                />
              </template>
              <template #body="slotProps">
                <Checkbox 
                  v-model="slotProps.data.selecionado"
                  :binary="true"
                />
              </template>
            </Column>
            <Column field="product.code" header="Código" sortable>
              <template #body="slotProps">
                {{ slotProps.data.product?.code || '-' }}
              </template>
            </Column>
            <Column field="product.description" header="Produto" sortable>
              <template #body="slotProps">
                {{ slotProps.data.product?.description || '-' }}
              </template>
            </Column>
            <Column field="quantity" header="Quantidade Original" sortable>
              <template #body="slotProps">
                {{ formatarQuantidade(slotProps.data.quantity) }}
              </template>
            </Column>
            <Column header="Quantidade Recebida">
              <template #body="slotProps">
                <InputNumber
                  v-model="slotProps.data.quantidade_recebida"
                  :min="0"
                  :max="slotProps.data.quantity"
                  :step="0.01"
                  :disabled="!slotProps.data.selecionado"
                  class="w-full"
                  :useGrouping="false"
                  mode="decimal"
                  :minFractionDigits="2"
                  :maxFractionDigits="2"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-content-end gap-2">
          <Button 
            label="Cancelar" 
            class="p-button-text" 
            @click="fecharModalRecebimento" 
          />
          <Button
            label="Confirmar Recebimento"
            icon="pi pi-check"
            class="p-button-success"
            :disabled="!modalRecebimento.tipo || (modalRecebimento.tipo === 'parcial' && !temItensSelecionados)"
            :loading="modalRecebimento.processando"
            @click="confirmarRecebimento"
          />
        </div>
      </template>
    </Dialog>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import StockTransferService from '@/service/StockTransferService';
import StockLocationService from '@/service/StockLocationService';
import PermissionsService from '@/service/PermissionsService';

export default {
  name: 'TransferenciasList',
  setup() {
    const toast = useToast();
    const confirm = useConfirm();
    const transferService = new StockTransferService();
    const locationService = new StockLocationService();
    const permissionsService = new PermissionsService();

    const transferencias = ref([]);
    const locais = ref([]);
    const carregando = ref(false);
    const processando = ref(null);

    const filtros = ref({
      status: null,
      local_origem_id: null,
      local_destino_id: null,
    });

    const statusOptions = [
      { label: 'Pendente', value: 'pendente' },
      { label: 'Recebido', value: 'recebido' },
      { label: 'Recebido Parcial', value: 'recebido_parcial' },
    ];

    const modalRecebimento = ref({
      visivel: false,
      carregando: false,
      processando: false,
      transferenciaId: null,
      tipo: 'total', // 'total' ou 'parcial'
      itens: [],
      todosSelecionados: false,
    });

    const carregarLocais = async () => {
      try {
        const { data } = await locationService.getAll({ per_page: 100 });
        locais.value = data.data || [];
      } catch (error) {
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Erro ao carregar locais';
        console.error('Erro ao carregar locais:', errorMessage);
      }
    };

    const carregar = async () => {
      carregando.value = true;
      try {
        const params = {};
        if (filtros.value.status) params.status = filtros.value.status;
        if (filtros.value.local_origem_id) params.local_origem_id = filtros.value.local_origem_id;
        if (filtros.value.local_destino_id) params.local_destino_id = filtros.value.local_destino_id;

        const { data } = await transferService.getAll(params);
        transferencias.value = data.data || [];
      } catch (error) {
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Erro ao carregar transferências';
        
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: errorMessage,
          life: 4000
        });
      } finally {
        carregando.value = false;
      }
    };

    const marcarRecebido = async (id) => {
      modalRecebimento.value.transferenciaId = id;
      modalRecebimento.value.visivel = true;
      modalRecebimento.value.carregando = true;
      modalRecebimento.value.tipo = 'total';
      modalRecebimento.value.itens = [];
      modalRecebimento.value.todosSelecionados = false;

      try {
        const { data } = await transferService.getById(id);
        const transferencia = data.data || data;
        
        // Preparar itens para o modal
        modalRecebimento.value.itens = (transferencia.items || []).map(item => ({
          id: item.id,
          stock_id: item.stock_id,
          stock_product_id: item.product?.id,
          product: item.product,
          quantity: item.quantity,
          quantidade_recebida: item.quantity, // Por padrão, recebe tudo
          selecionado: false,
        }));
      } catch (error) {
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Erro ao carregar dados da transferência';
        
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: errorMessage,
          life: 4000
        });
        fecharModalRecebimento();
      } finally {
        modalRecebimento.value.carregando = false;
      }
    };

    const fecharModalRecebimento = () => {
      modalRecebimento.value.visivel = false;
      modalRecebimento.value.transferenciaId = null;
      modalRecebimento.value.tipo = 'total';
      modalRecebimento.value.itens = [];
      modalRecebimento.value.todosSelecionados = false;
    };

    const toggleTodosItens = () => {
      modalRecebimento.value.itens.forEach(item => {
        item.selecionado = modalRecebimento.value.todosSelecionados;
        if (!item.selecionado) {
          item.quantidade_recebida = item.quantity;
        }
      });
    };

    const temItensSelecionados = computed(() => {
      return modalRecebimento.value.itens.some(item => item.selecionado);
    });

    const confirmarRecebimento = async () => {
      if (!modalRecebimento.value.tipo) {
        toast.add({
          severity: 'warn',
          summary: 'Atenção',
          detail: 'Selecione o tipo de recebimento',
          life: 3000
        });
        return;
      }

      if (modalRecebimento.value.tipo === 'parcial' && !temItensSelecionados.value) {
        toast.add({
          severity: 'warn',
          summary: 'Atenção',
          detail: 'Selecione pelo menos um item para recebimento parcial',
          life: 3000
        });
        return;
      }

      modalRecebimento.value.processando = true;

      try {
        const dados = {
          tipo: modalRecebimento.value.tipo,
        };

        if (modalRecebimento.value.tipo === 'parcial') {
          dados.itens = modalRecebimento.value.itens
            .filter(item => item.selecionado)
            .map(item => ({
              item_id: item.id,
              quantidade_recebida: parseFloat(item.quantidade_recebida) || 0,
            }));

          // Validar quantidades
          for (const item of dados.itens) {
            const itemOriginal = modalRecebimento.value.itens.find(i => i.id === item.item_id);
            if (item.quantidade_recebida > itemOriginal.quantity) {
              throw new Error(`A quantidade recebida não pode ser maior que a quantidade original para o item ${itemOriginal.product?.code || itemOriginal.product?.description}`);
            }
            if (item.quantidade_recebida <= 0) {
              throw new Error(`A quantidade recebida deve ser maior que zero para o item ${itemOriginal.product?.code || itemOriginal.product?.description}`);
            }
          }
        }

        await transferService.receber(modalRecebimento.value.transferenciaId, dados);
        
        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: modalRecebimento.value.tipo === 'total' 
            ? 'Transferência marcada como recebida' 
            : 'Transferência marcada como recebida parcialmente',
          life: 3000
        });
        
        fecharModalRecebimento();
        await carregar();
      } catch (error) {
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Erro ao marcar como recebido';
        
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: errorMessage,
          life: 4000
        });
      } finally {
        modalRecebimento.value.processando = false;
      }
    };

    const getSeverityStatus = (status) => {
      const map = {
        'pendente': 'warning',
        'recebido': 'success',
        'recebido_parcial': 'danger',
      };
      return map[status] || 'secondary';
    };

    const confirmarExclusao = (id) => {
      confirm.require({
        message: 'Tem certeza que deseja excluir esta transferência? Os materiais serão devolvidos ao estoque de origem.',
        header: 'Confirmar Exclusão',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          excluir(id);
        }
      });
    };

    const excluir = async (id) => {
      processando.value = id;
      try {
        await transferService.excluir(id);
        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Transferência excluída com sucesso',
          life: 3000
        });
        await carregar();
      } catch (error) {
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Erro ao excluir transferência';
        
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: errorMessage,
          life: 4000
        });
      } finally {
        processando.value = null;
      }
    };

    const imprimirDocumento = async (id) => {
      try {
        const response = await transferService.gerarDocumento(id);
        
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transferencia-${id}.pdf`;
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
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Erro ao gerar documento';
        
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: errorMessage,
          life: 4000
        });
      }
    };

    const formatarQuantidade = (qtd) => {
      if (!qtd) return '0,00';
      return parseFloat(qtd).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    };

    const formatarData = (data) => {
      if (!data) return '-';
      return data;
    };

    onMounted(() => {
      carregarLocais();
      carregar();
    });

    return {
      transferencias,
      locais,
      carregando,
      processando,
      filtros,
      statusOptions,
      modalRecebimento,
      temItensSelecionados,
      carregar,
      marcarRecebido,
      fecharModalRecebimento,
      toggleTodosItens,
      confirmarRecebimento,
      confirmarExclusao,
      excluir,
      imprimirDocumento,
      formatarQuantidade,
      formatarData,
      getSeverityStatus,
    };
  },
};
</script>

