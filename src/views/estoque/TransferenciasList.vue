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
        <Button label="Filtrar" icon="pi pi-filter" class="w-full mt-2" @click="aplicarFiltros" />
      </div>
    </div>

    <DataTable
      :value="transferencias"
      :paginator="true"
      :rows="paginacao.perPage"
      :totalRecords="paginacao.total"
      :lazy="true"
      :first="(paginacao.page - 1) * paginacao.perPage"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
      @page="onPageChange"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} transferências"
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
              v-if="slotProps.data.status === 'recebido_parcial'"
              icon="pi pi-eye"
              class="p-button-rounded p-button-text p-button-info p-button-sm"
              v-tooltip.top="'Ver Detalhes do Recebimento'"
              @click="verDetalhesRecebimento(slotProps.data.id)"
            />
            <Button
              v-if="slotProps.data.status === 'pendente' && podeReceberTransferencia(slotProps.data)"
              icon="pi pi-check"
              class="p-button-rounded p-button-text p-button-success p-button-sm"
              v-tooltip.top="'Marcar como Recebido'"
              @click="marcarRecebido(slotProps.data.id)"
              :loading="processando === slotProps.data.id"
            />
            <Button
              v-if="slotProps.data.status === 'pendente' && !podeReceberTransferencia(slotProps.data)"
              icon="pi pi-check"
              class="p-button-rounded p-button-text p-button-success p-button-sm"
              v-tooltip.top="'Apenas o dono do almoxarifado de destino pode receber a transferência'"
              disabled
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

    <!-- Modal de Detalhes do Recebimento Parcial -->
    <Dialog 
      v-model:visible="modalDetalhesRecebimento.visivel" 
      modal 
      header="Detalhes do Recebimento Parcial" 
      :style="{ width: '800px' }" 
      appendTo="body"
    >
      <div v-if="modalDetalhesRecebimento.carregando" class="text-center p-5">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <p class="mt-3">Carregando detalhes...</p>
      </div>
      
      <div v-else-if="modalDetalhesRecebimento.transferencia">
        <div class="mb-4">
          <div class="grid">
            <div class="col-12 md:col-6">
              <strong>Número da Transferência:</strong><br />
              {{ modalDetalhesRecebimento.transferencia.transfer_number }}
            </div>
            <div class="col-12 md:col-6">
              <strong>Status:</strong><br />
              <Tag 
                :value="modalDetalhesRecebimento.transferencia.status_label" 
                :severity="getSeverityStatus(modalDetalhesRecebimento.transferencia.status)" 
              />
            </div>
            <div class="col-12 md:col-6">
              <strong>Origem:</strong><br />
              {{ modalDetalhesRecebimento.transferencia.origin_location?.name || '-' }}
            </div>
            <div class="col-12 md:col-6">
              <strong>Destino:</strong><br />
              {{ modalDetalhesRecebimento.transferencia.destination_location?.name || '-' }}
            </div>
            <div class="col-12 md:col-6" v-if="modalDetalhesRecebimento.transferencia.driver_name">
              <strong>Motorista:</strong><br />
              {{ modalDetalhesRecebimento.transferencia.driver_name }}
            </div>
            <div class="col-12 md:col-6" v-if="modalDetalhesRecebimento.transferencia.license_plate">
              <strong>Placa:</strong><br />
              {{ modalDetalhesRecebimento.transferencia.license_plate }}
            </div>
            <div class="col-12" v-if="modalDetalhesRecebimento.transferencia.observation">
              <strong>Observação:</strong><br />
              {{ modalDetalhesRecebimento.transferencia.observation }}
            </div>
          </div>
        </div>

        <div class="mb-3">
          <Message severity="warn" :closable="false">
            <div class="m-0">
              <p class="font-semibold mb-2">Aviso de Transferência Parcial</p>
              <p class="m-0">
                Informamos que a transferência realizada do almoxarifado 
                <strong>{{ modalDetalhesRecebimento.transferencia.origin_location?.name || '-' }}</strong> 
                para o almoxarifado 
                <strong>{{ modalDetalhesRecebimento.transferencia.destination_location?.name || '-' }}</strong> 
                foi recebida parcialmente.
              </p>
            </div>
          </Message>
        </div>

        <DataTable
          :value="modalDetalhesRecebimento.itens"
          :paginator="true"
          :rows="10"
          responsiveLayout="scroll"
          class="p-datatable-sm"
        >
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
          <Column field="quantity" header="Quantidade Enviada" sortable>
            <template #body="slotProps">
              <span class="font-semibold">{{ formatarQuantidade(slotProps.data.quantity) }}</span>
            </template>
          </Column>
          <Column field="quantity_received" header="Quantidade Recebida" sortable>
            <template #body="slotProps">
              <span class="font-semibold"
                    :class="(parseFloat(slotProps.data.quantity_received) || 0) >= slotProps.data.quantity ? 'text-green-600' : 'text-orange-600'">
                {{ formatarQuantidade(slotProps.data.quantity_received || 0) }}
              </span>
            </template>
          </Column>
          <Column header="Situação">
            <template #body="slotProps">
              <Tag 
                v-if="slotProps.data.quantity_received !== null && slotProps.data.quantity_received !== undefined"
                :value="slotProps.data.quantity_received >= slotProps.data.quantity ? 'Recebido Total' : 'Recebimento Parcial'" 
                :severity="slotProps.data.quantity_received >= slotProps.data.quantity ? 'success' : 'warning'" 
              />
              <Tag v-else value="Pendente" severity="info" />
            </template>
          </Column>
        </DataTable>
      </div>

      <template #footer>
        <Button label="Fechar" class="p-button-text" @click="modalDetalhesRecebimento.visivel = false" />
      </template>
    </Dialog>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useStore } from 'vuex';
import Message from 'primevue/message';
import StockTransferService from '@/service/StockTransferService';
import StockLocationService from '@/service/StockLocationService';
import StockAlmoxarifeService from '@/service/StockAlmoxarifeService';
import PermissionsService from '@/service/PermissionsService';

export default {
  name: 'TransferenciasList',
  setup() {
    const toast = useToast();
    const confirm = useConfirm();
    const store = useStore();
    const transferService = new StockTransferService();
    const locationService = new StockLocationService();
    const almoxarifeService = new StockAlmoxarifeService();
    const permissionsService = new PermissionsService();

    const transferencias = ref([]);
    const locais = ref([]);
    const locaisUsuario = ref([]); // Locais onde o usuário é almoxarife
    const carregando = ref(false);
    const processando = ref(null);

    const paginacao = ref({
      page: 1,
      perPage: 10,
      total: 0,
      lastPage: 1,
    });

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

    const modalDetalhesRecebimento = ref({
      visivel: false,
      carregando: false,
      transferencia: null,
      itens: [],
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

    const carregarLocaisUsuario = async () => {
      try {
        const usuario = store.state.usuario;
        if (usuario && usuario.id) {
          const { data } = await almoxarifeService.listByAlmoxarife(usuario.id);
          // Converter para números para garantir comparação correta
          locaisUsuario.value = (data.locations || []).map(loc => parseInt(loc.id));
          console.log('Locais do usuário carregados:', locaisUsuario.value);
        }
      } catch (error) {
        // Se der erro, apenas logar - não é crítico
        console.error('Erro ao carregar locais do usuário:', error);
        locaisUsuario.value = [];
      }
    };

    const podeReceberTransferencia = (transferencia) => {
      if (!transferencia || !transferencia.destination_location) {
        console.log('Transferência sem destino:', transferencia);
        return false;
      }
      
      // Garantir que ambos sejam números para comparação
      const destinoId = parseInt(transferencia.destination_location.id);
      
      // Verificar se locaisUsuario está carregado
      if (!locaisUsuario.value || locaisUsuario.value.length === 0) {
        console.log('Locais do usuário não carregados ainda');
        return false;
      }
      
      // Comparar com diferentes formatos possíveis
      const podeReceber = locaisUsuario.value.some(localId => {
        const localIdNum = parseInt(localId);
        return localIdNum === destinoId;
      });
      
      // Debug apenas quando não pode receber
      if (!podeReceber) {
        console.log('Verificação de recebimento - NÃO PODE RECEBER:', {
          destinoId,
          tipoDestinoId: typeof destinoId,
          destinoNome: transferencia.destination_location.name,
          locaisUsuario: locaisUsuario.value,
          locaisUsuarioTipos: locaisUsuario.value.map(id => typeof id),
          transferenciaDestino: transferencia.destination_location
        });
      }
      
      return podeReceber;
    };

    const carregar = async () => {
      carregando.value = true;
      try {
        // Garantir que os locais do usuário estejam carregados
        if (locaisUsuario.value.length === 0) {
          await carregarLocaisUsuario();
        }

        const params = {
          page: paginacao.value.page,
          per_page: paginacao.value.perPage,
        };
        if (filtros.value.status) params.status = filtros.value.status;
        if (filtros.value.local_origem_id) params.local_origem_id = filtros.value.local_origem_id;
        if (filtros.value.local_destino_id) params.local_destino_id = filtros.value.local_destino_id;

        const { data } = await transferService.getAll(params);
        transferencias.value = data.data || [];
        const pag = data.pagination || {};
        paginacao.value.total = pag.total ?? 0;
        paginacao.value.page = pag.current_page ?? 1;
        paginacao.value.perPage = pag.per_page ?? 10;
        paginacao.value.lastPage = pag.last_page ?? 1;
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

    const onPageChange = (event) => {
      paginacao.value.page = event.page + 1;
      paginacao.value.perPage = event.rows;
      carregar();
    };

    const aplicarFiltros = () => {
      paginacao.value.page = 1;
      carregar();
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

    const verDetalhesRecebimento = async (id) => {
      modalDetalhesRecebimento.value.visivel = true;
      modalDetalhesRecebimento.value.carregando = true;
      modalDetalhesRecebimento.value.transferencia = null;
      modalDetalhesRecebimento.value.itens = [];

      try {
        const { data } = await transferService.getById(id);
        const transferencia = data.data || data;
        
        modalDetalhesRecebimento.value.transferencia = transferencia;
        modalDetalhesRecebimento.value.itens = transferencia.items || [];
      } catch (error) {
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Erro ao carregar detalhes da transferência';
        
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: errorMessage,
          life: 4000
        });
        modalDetalhesRecebimento.value.visivel = false;
      } finally {
        modalDetalhesRecebimento.value.carregando = false;
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
      carregarLocaisUsuario();
      carregar();
    });

    // Recarregar locais do usuário quando o usuário mudar
    watch(() => store.state.usuario, (novoUsuario) => {
      if (novoUsuario && novoUsuario.id) {
        carregarLocaisUsuario();
      }
    }, { immediate: false });

    return {
      transferencias,
      locais,
      locaisUsuario,
      carregando,
      processando,
      filtros,
      statusOptions,
      modalRecebimento,
      modalDetalhesRecebimento,
      temItensSelecionados,
      paginacao,
      carregar,
      aplicarFiltros,
      onPageChange,
      carregarLocaisUsuario,
      podeReceberTransferencia,
      marcarRecebido,
      fecharModalRecebimento,
      toggleTodosItens,
      confirmarRecebimento,
      confirmarExclusao,
      excluir,
      verDetalhesRecebimento,
      imprimirDocumento,
      formatarQuantidade,
      formatarData,
      getSeverityStatus,
    };
  },
  components: {
    Message,
  },
};
</script>

