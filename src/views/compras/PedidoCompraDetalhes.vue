<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <div class="flex align-items-center gap-2">
        <Button icon="pi pi-arrow-left" class="p-button-text" @click="$router.back()" />
        <h5 class="m-0">Detalhes do Pedido de Compra</h5>
      </div>
      <div class="flex gap-2">
        <Button
          label="Imprimir Cotação"
          icon="pi pi-print"
          class="p-button-secondary"
          @click="imprimirCotacao"
          :loading="imprimindoCotacao"
          :disabled="imprimindoCotacao || !pedido?.purchase_quote_id"
          v-if="pedido && pedido.purchase_quote_id"
        />
        <Button
          v-if="pedido && pedido.status === 'pendente' && isBuyer"
          label="Encaminhar para PROTHEUS"
          icon="pi pi-send"
          class="p-button-warning"
          @click="abrirModalStatus"
        />
        <Button
          v-else-if="pedido && isBuyer && pedido.status !== 'encerrado' && pedido.status !== 'cancelado'"
          :label="isOldStatus(pedido.status) ? 'Migrar Status' : 'Alterar Status'"
          :icon="isOldStatus(pedido.status) ? 'pi pi-arrow-right' : 'pi pi-sync'"
          :class="isOldStatus(pedido.status) ? 'p-button-warning' : 'p-button-info'"
          @click="abrirModalStatus"
        />
        <Button
          label="Imprimir"
          icon="pi pi-print"
          class="p-button-info"
          @click="imprimirPedido"
          :loading="imprimindo"
          :disabled="imprimindo"
          v-if="pedido"
        />
        <Button
          label="Criar Nota Fiscal"
          icon="pi pi-file"
          class="p-button-success"
          @click="criarNotaFiscal"
          v-if="pedido && pedido.status !== 'cancelado'"
        />
      </div>
    </div>

    <div v-if="carregando" class="text-center p-5">
      <ProgressSpinner />
    </div>

    <div v-else-if="pedido" class="grid">
      <!-- Status e Histórico -->
      <div class="col-12" v-if="pedido.status_history && pedido.status_history.length > 0">
        <Panel header="Histórico de Status">
          <Timeline :value="pedido.status_history" class="p-timeline-vertical">
            <template #marker="slotProps">
              <span class="flex w-2rem h-2rem align-items-center justify-content-center text-white border-circle z-1 shadow-1" :style="{ backgroundColor: getCorStatus(slotProps.item.new_status) === 'success' ? '#22c55e' : getCorStatus(slotProps.item.new_status) === 'danger' ? '#ef4444' : getCorStatus(slotProps.item.new_status) === 'warning' ? '#f59e0b' : '#6b7280' }">
                <i class="pi pi-check" v-if="slotProps.item.new_status !== 'link_reprovado'"></i>
                <i class="pi pi-times" v-else></i>
              </span>
            </template>
            <template #content="slotProps">
              <div class="flex flex-column">
                <div class="flex align-items-center gap-2 mb-1">
                  <Tag :value="getLabelStatus(slotProps.item.new_status)" :severity="getCorStatus(slotProps.item.new_status)" />
                  <span class="text-500 text-sm">{{ formatarData(slotProps.item.created_at) }}</span>
                </div>
                <div class="text-600 text-sm" v-if="slotProps.item.changed_by">
                  Alterado por: {{ slotProps.item.changed_by?.nome_completo || 'Sistema' }}
                </div>
                <div class="text-600 text-sm mt-1" v-if="slotProps.item.justification">
                  <strong>Justificativa:</strong> {{ slotProps.item.justification }}
                </div>
              </div>
            </template>
          </Timeline>
        </Panel>
      </div>

      <!-- Alerta para link_reprovado -->
      <div class="col-12" v-if="pedido.status === 'link_reprovado'">
        <Message severity="warn" :closable="false">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-exclamation-triangle"></i>
            <div>
              <strong>LINK Reprovado:</strong> A cotação foi retornada para "Compra em Andamento" para correções.
            </div>
          </div>
        </Message>
      </div>

      <!-- Informações Gerais -->
      <div class="col-12">
        <Panel header="Informações Gerais">
          <div class="grid">
            <div class="col-12 md:col-3">
              <strong>Nº do Pedido:</strong><br />
              <span class="text-primary font-bold">{{ pedido.order_number }}</span>
            </div>
            <div class="col-12 md:col-3">
              <strong>Data do Pedido:</strong><br />
              {{ formatarData(pedido.order_date) }}
            </div>
            <div class="col-12 md:col-3">
              <strong>Status:</strong><br />
              <Tag :value="getLabelStatus(pedido.status)" :severity="getCorStatus(pedido.status)" />
            </div>
            <div class="col-12 md:col-3">
              <strong>Valor Total:</strong><br />
              <span class="text-primary font-bold">{{ formatarValor(pedido.total_amount) }}</span>
            </div>
            <div class="col-12 md:col-3" v-if="pedido.freight_type || pedido.freight_value">
              <strong>Tipo de Frete:</strong><br />
              {{ pedido.freight_type === 'F' ? 'FOB' : (pedido.freight_type === 'C' ? 'CIF' : pedido.freight_type || '-') }}
            </div>
            <div class="col-12 md:col-3" v-if="pedido.freight_value">
              <strong>Valor do Frete:</strong><br />
              <span class="text-primary font-bold">{{ formatarValor(pedido.freight_value) }}</span>
            </div>
            <div class="col-12 md:col-6" v-if="pedido.quote">
              <strong>Cotação:</strong><br />
              {{ pedido.quote.quote_number || `#${pedido.purchase_quote_id}` }}
            </div>
            <div class="col-12 md:col-6" v-if="pedido.expected_delivery_date">
              <strong>Data Prevista de Entrega:</strong><br />
              {{ formatarData(pedido.expected_delivery_date) }}
            </div>
            <div class="col-12" v-if="pedido.observation">
              <strong>Observação:</strong><br />
              {{ pedido.observation }}
            </div>
          </div>
        </Panel>
      </div>

      <!-- Informações do Fornecedor -->
      <div class="col-12">
        <Panel header="Fornecedor">
          <div class="grid">
            <div class="col-12 md:col-4">
              <strong>Nome:</strong><br />
              {{ pedido.supplier_name }}
            </div>
            <div class="col-12 md:col-4" v-if="pedido.supplier_document">
              <strong>Documento:</strong><br />
              {{ pedido.supplier_document }}
            </div>
            <div class="col-12 md:col-4" v-if="pedido.supplier_code">
              <strong>Código:</strong><br />
              {{ pedido.supplier_code }}
            </div>
            <div class="col-12 md:col-4" v-if="pedido.vendor_name">
              <strong>Vendedor:</strong><br />
              {{ pedido.vendor_name }}
            </div>
            <div class="col-12 md:col-4" v-if="pedido.vendor_phone">
              <strong>Telefone:</strong><br />
              {{ pedido.vendor_phone }}
            </div>
            <div class="col-12 md:col-4" v-if="pedido.vendor_email">
              <strong>E-mail:</strong><br />
              {{ pedido.vendor_email }}
            </div>
            <div class="col-12 md:col-4" v-if="pedido.proposal_number">
              <strong>Nº Proposta:</strong><br />
              {{ pedido.proposal_number }}
            </div>
          </div>
        </Panel>
      </div>

      <!-- Itens do Pedido -->
      <div class="col-12">
        <Panel header="Itens do Pedido">
          <DataTable
            :value="pedido.items || []"
            :paginator="false"
            responsiveLayout="scroll"
            class="p-datatable-sm"
          >
            <Column field="product_code" header="Código" sortable></Column>
            <Column field="product_description" header="Descrição" sortable></Column>
            <Column field="quantity" header="Quantidade Pedida" sortable>
              <template #body="slotProps">
                {{ formatarQuantidade(slotProps.data.quantity) }} {{ slotProps.data.unit || 'UN' }}
              </template>
            </Column>
            <Column field="quantity_received" header="Recebido" sortable>
              <template #body="slotProps">
                <div>
                  {{ formatarQuantidade(slotProps.data.quantity_received || 0) }} {{ slotProps.data.unit || 'UN' }}
                  <br />
                  <ProgressBar 
                    :value="calcularPercentualRecebido(slotProps.data)" 
                    :showValue="false"
                    style="height: 0.5rem; margin-top: 0.25rem;"
                  />
                  <small class="text-500">
                    {{ calcularPercentualRecebido(slotProps.data).toFixed(0) }}%
                  </small>
                </div>
              </template>
            </Column>
            <Column field="status_recebimento" header="Status">
              <template #body="slotProps">
                <Tag 
                  :value="getStatusRecebimento(slotProps.data)"
                  :severity="getSeverityRecebimento(slotProps.data)"
                />
              </template>
            </Column>
            <Column field="unit_price" header="Preço Unit." sortable>
              <template #body="slotProps">
                {{ formatarValor(slotProps.data.unit_price) }}
              </template>
            </Column>
            <Column field="total_price" header="Total" sortable>
              <template #body="slotProps">
                <strong>{{ formatarValor(slotProps.data.total_price) }}</strong>
              </template>
            </Column>
            <Column field="final_cost" header="Custo Final" sortable>
              <template #body="slotProps">
                {{ formatarValor(slotProps.data.final_cost || slotProps.data.total_price) }}
              </template>
            </Column>
            <Column field="observation" header="Observação" v-if="pedido.items?.some(i => i.observation)"></Column>
          </DataTable>
        </Panel>
      </div>

      <!-- Notas Fiscais Relacionadas -->
      <div class="col-12" v-if="pedido.invoices && pedido.invoices.length > 0">
        <Panel header="Notas Fiscais">
          <DataTable
            :value="pedido.invoices"
            :paginator="false"
            responsiveLayout="scroll"
            class="p-datatable-sm"
          >
            <Column field="invoice_number" header="Nº NF" sortable></Column>
            <Column field="invoice_series" header="Série" sortable></Column>
            <Column field="invoice_date" header="Data" sortable>
              <template #body="slotProps">
                {{ formatarData(slotProps.data.invoice_date) }}
              </template>
            </Column>
            <Column field="total_amount" header="Valor Total" sortable>
              <template #body="slotProps">
                {{ formatarValor(slotProps.data.total_amount) }}
              </template>
            </Column>
            <Column header="Ações">
              <template #body="slotProps">
                <Button
                  icon="pi pi-eye"
                  class="p-button-rounded p-button-text p-button-info"
                  @click="visualizarNotaFiscal(slotProps.data.id)"
                  v-tooltip.top="'Visualizar nota fiscal'"
                />
              </template>
            </Column>
          </DataTable>
        </Panel>
      </div>
    </div>

    <!-- Modal de Alteração de Status -->
    <PedidoCompraStatusChange
      v-if="pedido"
      :pedido="pedido"
      :visible="modalStatusVisible"
      @update:visible="modalStatusVisible = $event"
      @status-updated="onStatusUpdated"
    />

    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import PurchaseOrderService from '@/service/PurchaseOrderService';
import SolicitacaoService from '@/service/SolicitacaoService';
import PedidoCompraStatusChange from '@/components/PedidoCompraStatusChange.vue';
import Timeline from 'primevue/timeline';
import Message from 'primevue/message';

export default {
  name: 'PedidoCompraDetalhes',
  components: {
    PedidoCompraStatusChange,
    Timeline,
    Message,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const store = useStore();
    const service = new PurchaseOrderService();
    const solicitacaoService = SolicitacaoService;

    const pedido = ref(null);
    const carregando = ref(false);
    const imprimindo = ref(false);
    const imprimindoCotacao = ref(false);
    const modalStatusVisible = ref(false);

    // Verificar se o usuário é comprador
    const isBuyer = computed(() => {
      const usuario = store.state.usuario;
      if (!usuario || !usuario.permissions || !Array.isArray(usuario.permissions)) {
        return false;
      }
      
      // Verificar se o usuário tem grupo/permissão de Comprador
      for (const perm of usuario.permissions) {
        if (perm && perm.name) {
          const groupName = perm.name.toLowerCase();
          if (groupName.includes('comprador') || groupName.includes('buyer')) {
            return true;
          }
        }
      }
      return false;
    });

    const carregar = async () => {
      const id = route.params.id;
      if (!id) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'ID do pedido não informado', life: 3000 });
        router.back();
        return;
      }

      try {
        carregando.value = true;
        const { data } = await service.get(id);
        pedido.value = data?.data || data;
        // O histórico já vem no relacionamento statusHistory do backend
        if (pedido.value && pedido.value.status_history) {
          // Ordenar por data mais recente primeiro
          pedido.value.status_history.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
          });
        }
      } catch (error) {
        const detail = error?.response?.data?.message || 'Erro ao carregar pedido de compra';
        toast.add({ severity: 'error', summary: 'Erro', detail, life: 3000 });
        router.back();
      } finally {
        carregando.value = false;
      }
    };

    const formatarValor = (valor) => {
      return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    };

    const formatarData = (data) => {
      if (!data) return '-';
      return new Date(data).toLocaleDateString('pt-BR');
    };

    const formatarQuantidade = (quantidade) => {
      return Number(quantidade || 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    };

    const getLabelStatus = (status) => {
      const statusMap = {
        pendente: 'Pendente',
        link: 'Aguardando LINK',
        link_aprovado: 'LINK Aprovado',
        link_reprovado: 'LINK Reprovado',
        coleta: 'Coleta',
        em_transito: 'Em Trânsito',
        atendido: 'Atendido',
        atendido_parcial: 'Atendido Parcial',
        pagamento: 'Pagamento',
        encerrado: 'Encerrado',
        recebido: 'Recebido (Antigo)',
        parcial: 'Parcial (Antigo)',
        parcialmente_recebido: 'Parcialmente Recebido (Antigo)',
        cancelado: 'Cancelado',
      };
      return statusMap[status] || status || '-';
    };

    const getCorStatus = (status) => {
      const corMap = {
        pendente: 'warning',
        link: 'warning',
        link_aprovado: 'success',
        link_reprovado: 'danger',
        coleta: 'info',
        em_transito: 'info',
        atendido: 'success',
        atendido_parcial: 'warning',
        pagamento: 'info',
        encerrado: 'success',
        recebido: 'success',
        parcial: 'info',
        parcialmente_recebido: 'info',
        cancelado: 'danger',
      };
      return corMap[status] || 'secondary';
    };

    const isOldStatus = (status) => {
      const oldStatuses = ['recebido', 'parcial', 'parcialmente_recebido'];
      return oldStatuses.includes(status);
    };

    const criarNotaFiscal = () => {
      router.push({
        name: 'notaFiscalNova',
        query: { pedido_id: pedido.value.id },
      });
    };

    const visualizarNotaFiscal = (invoiceId) => {
      // Implementar visualização de nota fiscal quando tiver tela
      toast.add({
        severity: 'info',
        summary: 'Visualizar NF',
        detail: `Funcionalidade em desenvolvimento - NF #${invoiceId}`,
        life: 2500,
      });
    };

    const calcularPercentualRecebido = (item) => {
      const quantity = parseFloat(item.quantity || 0);
      const received = parseFloat(item.quantity_received || 0);
      if (quantity === 0) return 0;
      return (received / quantity) * 100;
    };

    const getStatusRecebimento = (item) => {
      const quantity = parseFloat(item.quantity || 0);
      const received = parseFloat(item.quantity_received || 0);
      
      if (received >= quantity) {
        return 'Completo';
      } else if (received > 0) {
        return 'Parcial';
      }
      return 'Pendente';
    };

    const getSeverityRecebimento = (item) => {
      const quantity = parseFloat(item.quantity || 0);
      const received = parseFloat(item.quantity_received || 0);
      
      if (received >= quantity) {
        return 'success';
      } else if (received > 0) {
        return 'warning';
      }
      return 'danger';
    };

    const imprimirPedido = async () => {
      try {
        imprimindo.value = true;
        const id = route.params.id;
        await service.imprimir(id);
        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Abrindo PDF para impressão...',
          life: 2000,
        });
      } catch (error) {
        const detail = error?.response?.data?.message || 'Erro ao gerar PDF do pedido';
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail,
          life: 3000,
        });
      } finally {
        imprimindo.value = false;
      }
    };

    const abrirModalStatus = () => {
      modalStatusVisible.value = true;
    };

    const fecharModalStatus = () => {
      modalStatusVisible.value = false;
    };

    const onStatusUpdated = async () => {
      modalStatusVisible.value = false;
      await carregar();
      toast.add({
        severity: 'success',
        summary: 'Sucesso',
        detail: 'Status atualizado com sucesso!',
        life: 3000,
      });
    };

    const imprimirCotacao = async () => {
      try {
        imprimindoCotacao.value = true;
        const quoteId = pedido.value?.purchase_quote_id;
        if (!quoteId) {
          toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Cotação não encontrada para este pedido',
            life: 3000,
          });
          return;
        }

        const response = await solicitacaoService.imprimir(quoteId);
        
        // Criar blob do PDF
        const blob = new Blob([response.data], { type: 'application/pdf' });
        
        // Criar URL temporária
        const url = window.URL.createObjectURL(blob);
        
        // Abrir PDF em nova aba para visualização/impressão
        window.open(url, '_blank');
        
        // Limpar URL após um tempo
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 100);

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Abrindo PDF da cotação para impressão...',
          life: 2000,
        });
      } catch (error) {
        const detail = error?.response?.data?.message || 'Erro ao gerar PDF da cotação';
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail,
          life: 3000,
        });
      } finally {
        imprimindoCotacao.value = false;
      }
    };

    onMounted(carregar);

    return {
      pedido,
      carregando,
      imprimindo,
      imprimindoCotacao,
      modalStatusVisible,
      isBuyer,
      formatarValor,
      formatarData,
      formatarQuantidade,
      getLabelStatus,
      getCorStatus,
      isOldStatus,
      criarNotaFiscal,
      visualizarNotaFiscal,
      calcularPercentualRecebido,
      getStatusRecebimento,
      getSeverityRecebimento,
      imprimirPedido,
      imprimirCotacao,
      abrirModalStatus,
      fecharModalStatus,
      onStatusUpdated,
    };
  },
};
</script>

<style scoped>
.bg-page {
  background-color: #f6f9fb;
}
</style>

