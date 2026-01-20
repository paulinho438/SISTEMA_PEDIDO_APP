<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 m-0">Movimentações de Estoque</h5>
      <div class="flex gap-2">
        <Button 
          v-if="podeCriar"
          label="Entrada Manual" 
          icon="pi pi-plus" 
          class="p-button-success" 
          @click="abrirModalEntrada" 
        />
        <Button 
          v-if="podeCriar"
          label="Transferir entre Locais" 
          icon="pi pi-arrow-right-arrow-left" 
          class="p-button-info" 
          @click="abrirModalTransferencia" 
        />
        <Button 
          v-if="podeCriar"
          label="Ajuste Manual" 
          icon="pi pi-pencil" 
          class="p-button-warning" 
          @click="abrirModalAjuste" 
        />
      </div>
    </div>

    <div class="grid mb-3">
      <div class="col-12 md:col-3">
        <label for="tipoMovimento">Tipo</label>
        <Dropdown
          id="tipoMovimento"
          v-model="filtros.movement_type"
          :options="tiposMovimento"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos"
          class="w-full"
          showClear
        />
      </div>
      <div class="col-12 md:col-3">
        <label for="dataDe">Data De</label>
        <Calendar id="dataDe" v-model="filtros.date_from" dateFormat="yy-mm-dd" class="w-full" showClear />
      </div>
      <div class="col-12 md:col-3">
        <label for="dataAte">Data Até</label>
        <Calendar id="dataAte" v-model="filtros.date_to" dateFormat="yy-mm-dd" class="w-full" showClear />
      </div>
      <div class="col-12 md:col-3">
        <label>&nbsp;</label>
        <Button label="Filtrar" icon="pi pi-filter" class="w-full mt-2" @click="carregar" />
      </div>
    </div>

    <DataTable
      :value="movimentacoesAgrupadas"
      :paginator="true"
      :rows="10"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
    >
      <Column field="data" header="Data" sortable>
        <template #body="slotProps">
          {{ formatarData(slotProps.data.data) }}
        </template>
      </Column>
      <Column field="tipo" header="Tipo" sortable>
        <template #body="slotProps">
          <Tag :value="slotProps.data.tipo_label" :severity="getSeverityTipo(slotProps.data.tipo)" />
        </template>
      </Column>
      <Column field="product.description" header="Produto" sortable>
        <template #body="slotProps">
          <template v-if="slotProps.data.tipo !== 'transferencia'">
            {{ slotProps.data.product?.description || '-' }}
          </template>
          <template v-else>
            -
          </template>
        </template>
      </Column>
      <Column field="numero" header="Número" sortable>
        <template #body="slotProps">
          <template v-if="slotProps.data.tipo === 'transferencia'">
            {{ slotProps.data.numero || '-' }}
          </template>
          <template v-else>
            -
          </template>
        </template>
      </Column>
      <Column field="origem" header="Origem" sortable>
        <template #body="slotProps">
          <template v-if="slotProps.data.tipo === 'transferencia'">
            {{ slotProps.data.origem || '-' }}
          </template>
          <template v-else>
            -
          </template>
        </template>
      </Column>
      <Column field="destino" header="Destino" sortable>
        <template #body="slotProps">
          <template v-if="slotProps.data.tipo === 'transferencia'">
            {{ slotProps.data.destino || '-' }}
          </template>
          <template v-else>
            -
          </template>
        </template>
      </Column>
      <Column field="location.name" header="Local" sortable>
        <template #body="slotProps">
          <template v-if="slotProps.data.tipo !== 'transferencia'">
            {{ slotProps.data.location?.name || '-' }}
          </template>
          <template v-else>
            -
          </template>
        </template>
      </Column>
      <Column field="quantity" header="Quantidade" sortable>
        <template #body="slotProps">
          <template v-if="slotProps.data.tipo !== 'transferencia'">
            {{ formatarQuantidade(slotProps.data.quantity) }}
          </template>
          <template v-else>
            -
          </template>
        </template>
      </Column>
      <Column field="itens_count" header="Qtd. Itens" sortable>
        <template #body="slotProps">
          <template v-if="slotProps.data.tipo === 'transferencia'">
            {{ slotProps.data.itens_count || 0 }}
          </template>
          <template v-else>
            -
          </template>
        </template>
      </Column>
      <Column field="total_quantity" header="Qtd. Total" sortable>
        <template #body="slotProps">
          <template v-if="slotProps.data.tipo === 'transferencia'">
            {{ formatarQuantidade(slotProps.data.total_quantity) }}
          </template>
          <template v-else>
            -
          </template>
        </template>
      </Column>
      <Column field="observation" header="Observação" sortable>
        <template #body="slotProps">
          {{ slotProps.data.observation || '-' }}
        </template>
      </Column>
      <Column field="user.nome_completo" header="Usuário" sortable>
        <template #body="slotProps">
          {{ slotProps.data.user?.nome_completo || '-' }}
        </template>
      </Column>
      <Column header="Ações" :exportable="false">
        <template #body="slotProps">
          <Button
            v-if="slotProps.data.is_lote"
            icon="pi pi-eye"
            class="p-button-rounded p-button-text p-button-info p-button-sm"
            v-tooltip.top="'Ver Detalhes da Transferência'"
            @click="verDetalhesTransferencia(slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Modal de Entrada Manual -->
    <Dialog v-model:visible="modalEntrada.visivel" modal header="Entrada Manual de Produto" :style="{ width: '600px' }" appendTo="body">
      <div class="mb-4">
        <div class="mb-3">
          <div class="flex justify-content-between align-items-center mb-2">
            <label class="block text-600">Produto *</label>
            <Button 
              label="Criar Produto" 
              icon="pi pi-plus" 
              class="p-button-sm p-button-text p-button-success" 
              @click="abrirModalCriarProduto"
            />
          </div>
          <AutoComplete
            v-model="modalEntrada.produto"
            :suggestions="sugestoesProdutos"
            @complete="buscarProdutos($event)"
            optionLabel="description"
            placeholder="Buscar produto..."
            class="w-full"
            dropdown
            forceSelection
          >
            <template #item="slotProps">
              <div class="flex flex-column">
                <div class="font-semibold">{{ slotProps.item.code }}</div>
                <div class="text-sm text-500">{{ slotProps.item.description }}</div>
              </div>
            </template>
          </AutoComplete>
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Local *</label>
          <Dropdown
            v-model="modalEntrada.local"
            :options="locaisDisponiveis"
            optionLabel="name"
            optionValue="id"
            placeholder="Selecione o local"
            class="w-full"
            :filter="true"
          />
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Quantidade *</label>
          <InputNumber
            v-model="modalEntrada.quantidade"
            :min="0.0001"
            :step="0.0001"
            class="w-full"
            :useGrouping="false"
            :disabled="!modalEntrada.produto || !modalEntrada.local"
          />
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Custo Unitário (opcional)</label>
          <InputNumber
            v-model="modalEntrada.custo"
            :min="0"
            :step="0.01"
            class="w-full"
            :useGrouping="false"
            mode="decimal"
          />
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Observação</label>
          <Textarea v-model="modalEntrada.observacao" rows="3" class="w-full" placeholder="Informe observações sobre esta entrada..." />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-content-end gap-2">
          <Button label="Cancelar" class="p-button-text" @click="fecharModalEntrada" />
          <Button
            label="Registrar Entrada"
            icon="pi pi-check"
            class="p-button-success"
            :disabled="!modalEntrada.produto || !modalEntrada.local || !modalEntrada.quantidade"
            :loading="modalEntrada.loading"
            @click="confirmarEntrada"
          />
        </div>
      </template>
    </Dialog>

    <!-- Modal de Criar Produto Rápido -->
    <Dialog v-model:visible="modalCriarProduto.visivel" header="Criar Novo Produto" :modal="true" :style="{ width: '500px' }" appendTo="body">
      <div class="mb-4">
        <div class="mb-3">
          <label class="block text-600 mb-2">
            Código
            <small class="text-500">(gerado automaticamente)</small>
          </label>
          <InputText v-model="modalCriarProduto.code" class="w-full" disabled placeholder="Será gerado automaticamente" />
        </div>
        <div class="mb-3">
          <label class="block text-600 mb-2">Referência</label>
          <InputText v-model="modalCriarProduto.reference" class="w-full" placeholder="Opcional" />
        </div>
        <div class="mb-3">
          <label class="block text-600 mb-2">Descrição *</label>
          <InputText v-model="modalCriarProduto.description" class="w-full" placeholder="Nome do produto" />
        </div>
        <div class="mb-3">
          <label class="block text-600 mb-2">Unidade de Medida *</label>
          <InputText v-model="modalCriarProduto.unit" class="w-full" placeholder="Ex: UN, KG, M" />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-content-end gap-2">
          <Button label="Cancelar" class="p-button-text" @click="fecharModalCriarProduto" />
          <Button
            label="Criar e Selecionar"
            icon="pi pi-check"
            class="p-button-success"
            :disabled="!modalCriarProduto.description || !modalCriarProduto.unit"
            :loading="modalCriarProduto.loading"
            @click="confirmarCriarProduto"
          />
        </div>
      </template>
    </Dialog>

    <!-- Modal de Transferência -->
    <Dialog v-model:visible="modalTransferencia.visivel" modal header="Transferir entre Locais" :style="{ width: '600px' }" appendTo="body">
      <div class="mb-4">
        <div class="mb-3">
          <label class="block text-600 mb-2">Produto e Local de Origem *</label>
          <AutoComplete
            v-model="modalTransferencia.estoque"
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
          <label class="block text-600 mb-2">Local de Destino *</label>
          <Dropdown
            v-model="modalTransferencia.localDestino"
            :options="locaisDestino"
            optionLabel="name"
            optionValue="id"
            placeholder="Selecione o local de destino"
            class="w-full"
            :filter="true"
            :disabled="!modalTransferencia.estoque"
          />
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Quantidade *</label>
          <InputNumber
            v-model="modalTransferencia.quantidade"
            :min="0.0001"
            :max="modalTransferencia.estoque?.quantity_available || 0"
            :step="0.0001"
            class="w-full"
            :useGrouping="false"
            :disabled="!modalTransferencia.estoque || !modalTransferencia.localDestino"
          />
          <small v-if="modalTransferencia.estoque" class="text-500">
            Máximo disponível: {{ modalTransferencia.estoque.quantity_available }}
          </small>
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Observação</label>
          <Textarea v-model="modalTransferencia.observacao" rows="3" class="w-full" placeholder="Informe observações sobre esta transferência..." />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-content-end gap-2">
          <Button label="Cancelar" class="p-button-text" @click="fecharModalTransferencia" />
          <Button
            label="Transferir"
            icon="pi pi-check"
            class="p-button-info"
            :disabled="!modalTransferencia.estoque || !modalTransferencia.localDestino || !modalTransferencia.quantidade || modalTransferencia.estoque?.stock_location_id === modalTransferencia.localDestino"
            :loading="modalTransferencia.loading"
            @click="confirmarTransferencia"
          />
        </div>
      </template>
    </Dialog>

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

    <!-- Modal de Detalhes da Transferência -->
    <Dialog 
      v-model:visible="modalDetalhesTransferencia.visivel" 
      modal 
      header="Detalhes da Transferência" 
      :style="{ width: '800px' }" 
      appendTo="body"
    >
      <div v-if="modalDetalhesTransferencia.carregando" class="text-center p-5">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem"></i>
        <p class="mt-3">Carregando detalhes...</p>
      </div>
      
      <div v-else>
        <div class="mb-4" v-if="modalDetalhesTransferencia.transferencia">
          <div class="grid">
            <div class="col-12 md:col-6">
              <strong>Número:</strong> {{ modalDetalhesTransferencia.transferencia.numero }}
            </div>
            <div class="col-12 md:col-6">
              <strong>Data:</strong> {{ formatarData(modalDetalhesTransferencia.transferencia.data) }}
            </div>
            <div class="col-12 md:col-6">
              <strong>Origem:</strong> {{ modalDetalhesTransferencia.transferencia.origem }}
            </div>
            <div class="col-12 md:col-6">
              <strong>Destino:</strong> {{ modalDetalhesTransferencia.transferencia.destino }}
            </div>
            <div class="col-12" v-if="modalDetalhesTransferencia.transferencia.observation">
              <strong>Observação:</strong> {{ modalDetalhesTransferencia.transferencia.observation }}
            </div>
          </div>
        </div>

        <DataTable
          :value="modalDetalhesTransferencia.itens"
          :paginator="true"
          :rows="10"
          responsiveLayout="scroll"
          class="p-datatable-sm"
        >
          <Column field="codigo" header="Código" sortable></Column>
          <Column field="referencia" header="Referência" sortable></Column>
          <Column field="descricao" header="Descrição" sortable></Column>
          <Column field="quantidade" header="Quantidade" sortable>
            <template #body="slotProps">
              {{ formatarQuantidade(slotProps.data.quantidade) }}
            </template>
          </Column>
        </DataTable>
      </div>

      <template #footer>
        <Button label="Fechar" class="p-button-text" @click="modalDetalhesTransferencia.visivel = false" />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import PermissionsService from '@/service/PermissionsService';
import StockMovementService from '@/service/StockMovementService';
import StockProductService from '@/service/StockProductService';
import StockService from '@/service/StockService';
import StockLocationService from '@/service/StockLocationService';
import StockTransferService from '@/service/StockTransferService';

export default {
  name: 'MovimentacoesList',
  setup() {
    const toast = useToast();
    const permissionService = new PermissionsService();
    const movimentacoes = ref([]);
    const transferencias = ref([]);
    const carregando = ref(false);
    const modalDetalhesTransferencia = reactive({
      visivel: false,
      transferencia: null,
      itens: [],
      carregando: false,
    });
    const service = new StockMovementService();
    const stockService = new StockService();
    const productService = new StockProductService();
    const locationService = new StockLocationService();
    const transferService = new StockTransferService();

    // Verificar permissões
    const podeCriar = computed(() => permissionService.hasPermissions('view_estoque_movimentacoes_create'));

    const tiposMovimento = [
      { label: 'Entrada', value: 'entrada' },
      { label: 'Saída', value: 'saida' },
      { label: 'Ajuste', value: 'ajuste' },
      { label: 'Transferência', value: 'transferencia' },
    ];

    const tiposAjuste = [
      { label: 'Entrada', value: 'entrada' },
      { label: 'Saída', value: 'saida' },
    ];

    const filtros = ref({
      movement_type: null,
      date_from: null,
      date_to: null,
    });

    // Estados dos modais
    const modalEntrada = reactive({
      visivel: false,
      produto: null,
      local: null,
      quantidade: null,
      custo: null,
      observacao: '',
      loading: false,
    });

    const modalCriarProduto = reactive({
      visivel: false,
      code: '',
      reference: '',
      description: '',
      unit: 'UN',
      loading: false,
    });

    const modalTransferencia = reactive({
      visivel: false,
      estoque: null,
      localDestino: null,
      quantidade: null,
      observacao: '',
      loading: false,
    });

    const modalAjuste = reactive({
      visivel: false,
      estoque: null,
      tipo: null,
      quantidade: null,
      custo: null,
      observacao: '',
      loading: false,
    });

    // Dados auxiliares
    const locaisDisponiveis = ref([]); // Locais com acesso (para entrada manual)
    const locaisDestino = ref([]); // Todos os locais ativos (para destino em transferência)
    const sugestoesProdutos = ref([]);
    const sugestoesEstoque = ref([]);
    
    let timeoutBuscaProdutos = null;
    let timeoutBuscaEstoque = null;

    const formatarData = (data) => {
      if (!data) return '-';
      try {
        // Se já estiver formatada como string, retornar
        if (typeof data === 'string' && data.includes('/')) {
          return data;
        }
        // Tentar parsear a data
        const dataObj = new Date(data);
        if (isNaN(dataObj.getTime())) {
          return '-';
        }
        return dataObj.toLocaleDateString('pt-BR');
      } catch (error) {
        return '-';
      }
    };

    const formatarQuantidade = (qtd) => {
      return qtd ? parseFloat(qtd).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '0,0000';
    };

    const getSeverityTipo = (tipo) => {
      const map = {
        entrada: 'success',
        saida: 'danger',
        ajuste: 'warning',
        transferencia: 'info',
      };
      return map[tipo] || 'secondary';
    };

    const ehTransferencia = computed(() => {
      const tipo = filtros.value.movement_type;
      // Pode ser string ou objeto, então verificamos ambos
      if (typeof tipo === 'string') {
        return tipo === 'transferencia';
      }
      if (tipo && typeof tipo === 'object') {
        return tipo.value === 'transferencia';
      }
      return false;
    });

    const carregar = async () => {
      try {
        carregando.value = true;
        
        // Sempre buscar transferências em lote (para mostrar o ícone de olho quando necessário)
        const paramsTransferencias = {};
        // Aplicar filtro de data se houver
        if (filtros.value.date_from) paramsTransferencias.date_from = new Date(filtros.value.date_from).toISOString().split('T')[0];
        if (filtros.value.date_to) paramsTransferencias.date_to = new Date(filtros.value.date_to).toISOString().split('T')[0];
        
        try {
          const { data } = await transferService.getAll({ ...paramsTransferencias, per_page: 100 });
          // A resposta vem em data.data conforme o controller
          transferencias.value = data?.data || [];
        } catch (error) {
          console.error('Erro ao carregar transferências:', error);
          transferencias.value = [];
        }
        
        // Buscar movimentações normais
        const params = { ...filtros.value, per_page: 100 };
        if (params.date_from) params.date_from = new Date(params.date_from).toISOString().split('T')[0];
        if (params.date_to) params.date_to = new Date(params.date_to).toISOString().split('T')[0];
        
        // Se o filtro for transferência, não buscar movimentações individuais
        if (!ehTransferencia.value) {
          const { data } = await service.getAll(params);
          movimentacoes.value = data.data || [];
        } else {
          movimentacoes.value = [];
        }
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar movimentações', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };

    const movimentacoesAgrupadas = computed(() => {
      // Mapear transferências em lote para formato padronizado
      const transferenciasLote = (transferencias.value || []).map(t => {
        // Garantir que os dados estejam acessíveis corretamente
        // O Resource retorna origin_location e destination_location como objetos
        const originName = (t.origin_location && typeof t.origin_location === 'object') 
          ? (t.origin_location.name || '-')
          : (typeof t.origin_location === 'string' ? t.origin_location : '-');
        
        const destName = (t.destination_location && typeof t.destination_location === 'object')
          ? (t.destination_location.name || '-')
          : (typeof t.destination_location === 'string' ? t.destination_location : '-');
        
        const userName = (t.user && typeof t.user === 'object')
          ? (t.user.name || t.user.nome_completo || '-')
          : (typeof t.user === 'string' ? t.user : '-');
        
        return {
          id: `transfer_${t.id}`,
          data: t.created_at,
          tipo: 'transferencia',
          tipo_label: 'Transferência',
          numero: t.transfer_number || `TRANS-${t.id}`,
          origem: originName,
          destino: destName,
          observation: t.observation || '-',
          user: { nome_completo: userName },
          itens_count: t.items_count || (t.items?.length || 0),
          total_quantity: t.total_quantity || (t.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0),
          transferencia_id: t.id,
          is_lote: true, // Marca como transferência em lote
        };
      });
      
      // Para outras movimentações, agrupar transferências antigas (que criam 2 movimentações)
      // Mas excluir transferências que já estão na lista de transferências em lote
      // As transferências em lote NÃO criam movimentações individuais, então não precisamos filtrá-las
      const movimentacoesNormais = movimentacoes.value.filter(m => m.movement_type !== 'transferencia');
      
      // Filtrar apenas transferências antigas (que não são de lote)
      // Transferências de lote têm reference_type = 'transferencia_lote' ou reference_id apontando para stock_transfers
      // Mas como o StockTransferService não cria movimentações, todas as transferências aqui são antigas
      const movimentacoesTransferencia = movimentacoes.value.filter(m => {
        if (m.movement_type !== 'transferencia') return false;
        // Se tem reference_type = 'transferencia_lote', já está representada por uma transferência em lote
        if (m.reference_type === 'transferencia_lote') return false;
        // Se tem reference_id que corresponde a uma transferência em lote, também já está representada
        if (m.reference_id && transferenciasLote.some(t => t.transferencia_id === m.reference_id)) {
          return false;
        }
        return true;
      });
      
      // Agrupar transferências antigas por observação (sem número de transferência)
      const transferenciasAgrupadas = [];
      const transferenciasProcessadas = new Set();
      
      movimentacoesTransferencia.forEach(mov => {
        // Extrair observação base (sem "Transferência: Origem" ou "Transferência: Destino")
        const obsBase = mov.observation?.replace(/\s*\(Transferência:\s*(Origem|Destino)\)/i, '').trim() || '';
        const chave = `${mov.stock_product_id}-${mov.movement_date}-${obsBase}`;
        
        if (!transferenciasProcessadas.has(chave)) {
          transferenciasProcessadas.add(chave);
          
          // Encontrar a movimentação de destino correspondente
          const movDestino = movimentacoesTransferencia.find(m => 
            m.stock_product_id === mov.stock_product_id &&
            m.movement_date === mov.movement_date &&
            m.observation?.includes(obsBase) &&
            m.observation?.includes('Destino') &&
            m.id !== mov.id
          );
          
          transferenciasAgrupadas.push({
            id: mov.id,
            data: mov.movement_date || mov.created_at,
            tipo: 'transferencia',
            tipo_label: 'Transferência',
            numero: '-',
            origem: mov.location?.name || '-',
            destino: movDestino?.location?.name || '-',
            observation: obsBase || mov.observation || '-',
            user: mov.user || { nome_completo: '-' },
            itens_count: 1,
            total_quantity: Math.abs(mov.quantity),
            transferencia_id: null,
            is_lote: false, // Transferência antiga (não é lote)
            movimentacoes: [mov, movDestino].filter(Boolean),
          });
        }
      });
      
      // Se filtro for transferência, retornar apenas transferências em lote e transferências antigas agrupadas
      if (ehTransferencia.value) {
        return [...transferenciasLote, ...transferenciasAgrupadas];
      }
      
      // Combinar tudo: movimentações normais, transferências antigas agrupadas e transferências em lote
      // SEMPRE incluir transferências em lote, mesmo sem filtro
      const todasMovimentacoes = [
        ...movimentacoesNormais.map(m => ({
          ...m,
          data: m.movement_date || m.created_at,
          tipo: m.movement_type,
          tipo_label: tiposMovimento.find(t => t.value === m.movement_type)?.label || m.movement_type,
          is_lote: false,
        })),
        ...transferenciasAgrupadas,
        ...transferenciasLote, // SEMPRE incluir transferências em lote
      ];
      
      // Ordenar por data (mais recente primeiro)
      // Converter todas as datas para um formato comparável
      return todasMovimentacoes.sort((a, b) => {
        try {
          // Função auxiliar para converter data para timestamp
          const getTimestamp = (dataStr) => {
            if (!dataStr) return 0;
            
            // Se já está em formato de data ISO ou timestamp
            if (typeof dataStr === 'string') {
              // Tentar formato brasileiro DD/MM/YYYY HH:mm:ss ou DD/MM/YYYY
              const brFormat = dataStr.match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
              if (brFormat) {
                const [, dia, mes, ano, hora = '00', minuto = '00', segundo = '00'] = brFormat;
                const dateStr = `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`;
                const parsed = new Date(dateStr);
                if (!isNaN(parsed.getTime())) {
                  return parsed.getTime();
                }
              }
              
              // Tentar parsear como ISO string ou outros formatos
              const parsed = new Date(dataStr);
              if (!isNaN(parsed.getTime())) {
                return parsed.getTime();
              }
            }
            
            // Se for um objeto Date
            if (dataStr instanceof Date) {
              return dataStr.getTime();
            }
            
            return 0;
          };
          
          const timestampA = getTimestamp(a.data);
          const timestampB = getTimestamp(b.data);
          
          // Se ambas as datas são válidas, ordenar por timestamp (mais recente primeiro)
          if (timestampA > 0 && timestampB > 0) {
            return timestampB - timestampA; // Ordem decrescente (mais recente primeiro)
          }
          
          // Se uma data é inválida, colocar no final
          if (timestampA > 0) return -1;
          if (timestampB > 0) return 1;
          
          return 0;
        } catch (error) {
          console.error('Erro ao ordenar movimentações:', error, a, b);
          return 0;
        }
      });
    });

    const carregarLocais = async () => {
      try {
        const { data } = await locationService.getAll({ per_page: 100 });
        locaisDisponiveis.value = data.data || [];
      } catch (error) {
        console.error('Erro ao carregar locais:', error);
      }
    };

    const carregarLocaisDestino = async () => {
      try {
        const { data } = await locationService.getAllActive({ per_page: 100 });
        locaisDestino.value = data.data || [];
      } catch (error) {
        console.error('Erro ao carregar locais de destino:', error);
      }
    };

    // Métodos do Modal de Entrada
    const abrirModalEntrada = async () => {
      modalEntrada.visivel = true;
      modalEntrada.produto = null;
      modalEntrada.local = null;
      modalEntrada.quantidade = null;
      modalEntrada.custo = null;
      modalEntrada.observacao = '';
      
      if (locaisDisponiveis.value.length === 0) {
        await carregarLocais();
      }
    };

    const fecharModalEntrada = () => {
      modalEntrada.visivel = false;
    };

    const buscarProdutos = async (event) => {
      const query = event.query;
      
      if (!query || query.length < 2) {
        sugestoesProdutos.value = [];
        return;
      }

      if (timeoutBuscaProdutos) {
        clearTimeout(timeoutBuscaProdutos);
      }

      timeoutBuscaProdutos = setTimeout(async () => {
        try {
          const response = await productService.getAll({ search: query, per_page: 20 });
          const data = response?.data?.data ?? response?.data ?? [];
          sugestoesProdutos.value = Array.isArray(data) ? data : [];
        } catch (error) {
          console.error('Erro ao buscar produtos:', error);
          sugestoesProdutos.value = [];
        }
      }, 300);
    };

    const confirmarEntrada = async () => {
      if (!modalEntrada.produto || !modalEntrada.local || !modalEntrada.quantidade) {
        return;
      }

      try {
        modalEntrada.loading = true;

        const dados = {
          product_id: modalEntrada.produto.id,
          location_id: modalEntrada.local,
          quantity: modalEntrada.quantidade,
          cost: modalEntrada.custo || null,
          observation: modalEntrada.observacao || null,
        };

        await service.entrada(dados);

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Entrada registrada com sucesso!',
          life: 3000
        });

        fecharModalEntrada();
        await carregar();
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao registrar entrada',
          life: 3000
        });
      } finally {
        modalEntrada.loading = false;
      }
    };

    // Métodos do Modal de Criar Produto
    const abrirModalCriarProduto = () => {
      modalCriarProduto.visivel = true;
      modalCriarProduto.code = '';
      modalCriarProduto.reference = '';
      modalCriarProduto.description = '';
      modalCriarProduto.unit = 'UN';
    };

    const fecharModalCriarProduto = () => {
      modalCriarProduto.visivel = false;
    };

    const confirmarCriarProduto = async () => {
      if (!modalCriarProduto.description || !modalCriarProduto.unit) {
        return;
      }

      try {
        modalCriarProduto.loading = true;

        const dados = {
          // Não enviar code, será gerado automaticamente no backend
          reference: modalCriarProduto.reference || null,
          description: modalCriarProduto.description,
          unit: modalCriarProduto.unit,
          active: true,
        };

        const response = await productService.save(dados);
        const produtoCriado = response?.data?.data ?? response?.data ?? {};

        // Selecionar o produto criado no campo de produto
        modalEntrada.produto = produtoCriado;

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: `Produto criado e selecionado! Código: ${produtoCriado.code}`,
          life: 3000
        });

        fecharModalCriarProduto();
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao criar produto',
          life: 3000
        });
      } finally {
        modalCriarProduto.loading = false;
      }
    };

    // Métodos do Modal de Transferência
    const abrirModalTransferencia = async () => {
      modalTransferencia.visivel = true;
      modalTransferencia.estoque = null;
      modalTransferencia.localDestino = null;
      modalTransferencia.quantidade = null;
      modalTransferencia.observacao = '';
      
      if (locaisDestino.value.length === 0) {
        await carregarLocaisDestino();
      }
    };

    const fecharModalTransferencia = () => {
      modalTransferencia.visivel = false;
    };

    const buscarEstoque = async (event) => {
      const query = event.query;
      
      if (!query || query.length < 2) {
        sugestoesEstoque.value = [];
        return;
      }

      if (timeoutBuscaEstoque) {
        clearTimeout(timeoutBuscaEstoque);
      }

      timeoutBuscaEstoque = setTimeout(async () => {
        try {
          const response = await stockService.getAll({ 
            search: query, 
            has_available: true,
            per_page: 20 
          });
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

    const confirmarTransferencia = async () => {
      if (!modalTransferencia.estoque || !modalTransferencia.localDestino || !modalTransferencia.quantidade) {
        return;
      }

      if (modalTransferencia.estoque.stock_location_id === modalTransferencia.localDestino) {
        toast.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'O local de origem e destino devem ser diferentes.',
          life: 3000
        });
        return;
      }

      try {
        modalTransferencia.loading = true;

        const dados = {
          stock_id: modalTransferencia.estoque.id,
          to_location_id: modalTransferencia.localDestino,
          quantity: modalTransferencia.quantidade,
          observation: modalTransferencia.observacao || null,
        };

        await service.transferir(dados);

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Transferência realizada com sucesso!',
          life: 3000
        });

        fecharModalTransferencia();
        await carregar();
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao realizar transferência',
          life: 3000
        });
      } finally {
        modalTransferencia.loading = false;
      }
    };

    // Métodos do Modal de Ajuste
    const abrirModalAjuste = async () => {
      modalAjuste.visivel = true;
      modalAjuste.estoque = null;
      modalAjuste.tipo = null;
      modalAjuste.quantidade = null;
      modalAjuste.custo = null;
      modalAjuste.observacao = '';
    };

    const fecharModalAjuste = () => {
      modalAjuste.visivel = false;
    };

    const verDetalhesTransferencia = async (transferencia) => {
      modalDetalhesTransferencia.visivel = true;
      modalDetalhesTransferencia.transferencia = transferencia;
      modalDetalhesTransferencia.carregando = true;
      modalDetalhesTransferencia.itens = [];

      try {
        if (transferencia.is_lote && transferencia.transferencia_id) {
          // Buscar detalhes da transferência em lote
          const { data } = await transferService.getById(transferencia.transferencia_id);
          const transferenciaCompleta = data.data;
          
          if (transferenciaCompleta && transferenciaCompleta.items) {
            modalDetalhesTransferencia.itens = transferenciaCompleta.items.map(item => ({
              codigo: item.product?.code || '-',
              referencia: item.product?.reference || '-',
              descricao: item.product?.description || '-',
              quantidade: item.quantity,
            }));
          }
        } else if (transferencia.movimentacoes) {
          // Para transferências antigas (não em lote), usar as movimentações
          modalDetalhesTransferencia.itens = transferencia.movimentacoes
            .filter(m => m.quantity < 0) // Apenas a de origem (negativa)
            .map(mov => ({
              codigo: mov.product?.code || '-',
              referencia: mov.product?.reference || '-',
              descricao: mov.product?.description || '-',
              quantidade: Math.abs(mov.quantity),
            }));
        }
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar detalhes da transferência',
          life: 3000
        });
      } finally {
        modalDetalhesTransferencia.carregando = false;
      }
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

        await service.ajuste(dados);

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Ajuste realizado com sucesso!',
          life: 3000
        });

        fecharModalAjuste();
        await carregar();
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
      carregar();
      carregarLocais();
    });

    return {
      movimentacoes,
      carregando,
      tiposMovimento,
      tiposAjuste,
      filtros,
      modalEntrada,
      modalCriarProduto,
      modalTransferencia,
      modalAjuste,
      locaisDisponiveis,
      locaisDestino,
      sugestoesProdutos,
      sugestoesEstoque,
      podeCriar,
      abrirModalCriarProduto,
      fecharModalCriarProduto,
      confirmarCriarProduto,
      formatarData,
      formatarQuantidade,
      getSeverityTipo,
      carregar,
      abrirModalEntrada,
      fecharModalEntrada,
      buscarProdutos,
      confirmarEntrada,
      abrirModalTransferencia,
      fecharModalTransferencia,
      buscarEstoque,
      confirmarTransferencia,
      abrirModalAjuste,
      fecharModalAjuste,
      confirmarAjuste,
      ehTransferencia,
      movimentacoesAgrupadas,
      verDetalhesTransferencia,
      modalDetalhesTransferencia,
    };
  },
};
</script>

