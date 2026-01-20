<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 m-0">Consulta de Estoque</h5>
      <Button label="Entrada Manual" icon="pi pi-plus" class="p-button-success" @click="abrirModalEntrada" />
    </div>

    <div class="grid mb-3">
      <div class="col-12 md:col-4">
        <label for="filtroProduto">Produto</label>
        <InputText id="filtroProduto" v-model="filtros.search" placeholder="Buscar produto..." class="w-full" />
      </div>
      <div class="col-12 md:col-4">
        <label for="filtroLocal">Local</label>
        <Dropdown
          id="filtroLocal"
          v-model="filtros.location_id"
          :options="locais"
          optionLabel="name"
          optionValue="id"
          placeholder="Todos os locais"
          class="w-full"
          showClear
        />
      </div>
      <div class="col-12 md:col-4">
        <div class="flex align-items-center gap-2 mt-4">
          <Checkbox id="hasAvailable" v-model="filtros.has_available" :binary="true" />
          <label for="hasAvailable">Apenas com estoque disponível</label>
        </div>
      </div>
    </div>

    <DataTable
      :value="estoques"
      :paginator="true"
      :rows="10"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
    >
      <Column field="product.description" header="Produto" sortable>
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
          {{ formatarQuantidade(slotProps.data.quantity_available) }}
        </template>
      </Column>
      <Column field="quantity_reserved" header="Reservado" sortable>
        <template #body="slotProps">
          {{ formatarQuantidade(slotProps.data.quantity_reserved) }}
        </template>
      </Column>
      <Column field="quantity_total" header="Total" sortable>
        <template #body="slotProps">
          {{ formatarQuantidade(slotProps.data.quantity_total) }}
        </template>
      </Column>
      <Column header="Ações" headerStyle="width:15rem">
        <template #body="slotProps">
          <div class="flex gap-1 flex-wrap">
            <Button
              label="Ajuste"
              icon="pi pi-pencil"
              class="p-button-sm p-button-outlined p-button-warning"
              @click="abrirModalAjuste(slotProps.data)"
            />
            <Button
              v-if="slotProps.data.quantity_available > 0"
              label="Transferir"
              icon="pi pi-arrow-right-arrow-left"
              class="p-button-sm p-button-outlined p-button-info"
              @click="abrirModalTransferencia(slotProps.data)"
            />
            <Button
              v-if="slotProps.data.quantity_available > 0"
              label="Reservar"
              icon="pi pi-lock"
              class="p-button-sm p-button-outlined p-button-success"
              @click="abrirModalReservar(slotProps.data)"
            />
            <Button
              v-if="slotProps.data.quantity_reserved > 0"
              label="Liberar"
              icon="pi pi-unlock"
              class="p-button-sm p-button-outlined"
              @click="abrirModalLiberar(slotProps.data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="modalReservar" header="Reservar Quantidade" :modal="true" :style="{ width: '400px' }">
      <div class="grid">
        <div class="col-12">
          <label>Quantidade</label>
          <InputNumber v-model="formReserva.quantity" :min="0.0001" :max="estoqueSelecionado?.quantity_available" class="w-full" />
        </div>
        <div class="col-12">
          <label>Observação</label>
          <Textarea v-model="formReserva.observation" class="w-full" rows="3" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" class="p-button-outlined" @click="modalReservar = false" />
        <Button label="Reservar" @click="reservar" :loading="processando" />
      </template>
    </Dialog>

    <Dialog v-model:visible="modalLiberar" header="Liberar Quantidade" :modal="true" :style="{ width: '400px' }">
      <div class="grid">
        <div class="col-12">
          <label>Quantidade</label>
          <InputNumber v-model="formLiberar.quantity" :min="0.0001" :max="estoqueSelecionado?.quantity_reserved" class="w-full" />
        </div>
        <div class="col-12">
          <label>Observação</label>
          <Textarea v-model="formLiberar.observation" class="w-full" rows="3" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" class="p-button-outlined" @click="modalLiberar = false" />
        <Button label="Liberar" @click="liberar" :loading="processando" />
      </template>
    </Dialog>

    <!-- Modal de Entrada Manual -->
    <Dialog v-model:visible="modalEntrada.visivel" header="Entrada Manual de Produto" :modal="true" :style="{ width: '600px' }">
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
            :options="locais"
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
    <Dialog v-model:visible="modalCriarProduto.visivel" header="Criar Novo Produto" :modal="true" :style="{ width: '500px' }">
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

    <!-- Modal de Ajuste -->
    <Dialog v-model:visible="modalAjuste.visivel" header="Ajuste Manual de Estoque" :modal="true" :style="{ width: '500px' }">
      <div class="grid">
        <div class="col-12">
          <div class="mb-2">
            <strong>Produto:</strong> {{ estoqueSelecionado?.product?.description }}
          </div>
          <div class="mb-2">
            <strong>Local:</strong> {{ estoqueSelecionado?.location?.name }}
          </div>
          <div class="mb-3">
            <strong>Disponível:</strong> {{ formatarQuantidade(estoqueSelecionado?.quantity_available) }}
          </div>
        </div>
        <div class="col-12">
          <label>Tipo de Ajuste *</label>
          <Dropdown
            v-model="formAjuste.movement_type"
            :options="tiposAjuste"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecione o tipo"
            class="w-full"
          />
        </div>
        <div class="col-12">
          <label>Quantidade *</label>
          <InputNumber
            v-model="formAjuste.quantity"
            :min="0.0001"
            :max="formAjuste.movement_type === 'saida' ? estoqueSelecionado?.quantity_available : null"
            class="w-full"
            :disabled="!formAjuste.movement_type"
          />
        </div>
        <div class="col-12">
          <label>Custo Unitário (opcional)</label>
          <InputNumber v-model="formAjuste.cost" :min="0" :step="0.01" class="w-full" mode="decimal" />
        </div>
        <div class="col-12">
          <label>Observação</label>
          <Textarea v-model="formAjuste.observation" class="w-full" rows="3" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" class="p-button-outlined" @click="modalAjuste.visivel = false" />
        <Button
          label="Aplicar Ajuste"
          @click="aplicarAjuste"
          :loading="processando"
          :disabled="!formAjuste.movement_type || !formAjuste.quantity"
        />
      </template>
    </Dialog>

    <!-- Modal de Transferência -->
    <Dialog v-model:visible="modalTransferencia.visivel" header="Transferir entre Locais" :modal="true" :style="{ width: '500px' }">
      <div class="grid">
        <div class="col-12">
          <div class="mb-2">
            <strong>Produto:</strong> {{ estoqueSelecionado?.product?.description }}
          </div>
          <div class="mb-2">
            <strong>Local de Origem:</strong> {{ estoqueSelecionado?.location?.name }}
          </div>
          <div class="mb-3">
            <strong>Disponível:</strong> {{ formatarQuantidade(estoqueSelecionado?.quantity_available) }}
          </div>
        </div>
        <div class="col-12">
          <label>Local de Destino *</label>
          <Dropdown
            v-model="formTransferencia.localDestino"
            :options="locaisDestino"
            optionLabel="name"
            optionValue="id"
            placeholder="Selecione o local de destino"
            class="w-full"
            :filter="true"
          />
        </div>
        <div class="col-12">
          <label>Quantidade *</label>
          <InputNumber
            v-model="formTransferencia.quantidade"
            :min="0.0001"
            :max="estoqueSelecionado?.quantity_available"
            class="w-full"
            :disabled="!formTransferencia.localDestino"
          />
        </div>
        <div class="col-12">
          <label>Observação</label>
          <Textarea v-model="formTransferencia.observacao" class="w-full" rows="3" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" class="p-button-outlined" @click="modalTransferencia.visivel = false" />
        <Button
          label="Transferir"
          @click="confirmarTransferencia"
          :loading="processando"
          :disabled="!formTransferencia.localDestino || !formTransferencia.quantidade || estoqueSelecionado?.stock_location_id === formTransferencia.localDestino"
        />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import StockService from '@/service/StockService';
import StockLocationService from '@/service/StockLocationService';
import StockProductService from '@/service/StockProductService';
import StockMovementService from '@/service/StockMovementService';

export default {
  name: 'EstoqueConsulta',
  setup() {
    const toast = useToast();
    const estoques = ref([]);
    const locais = ref([]);
    const carregando = ref(false);
    const processando = ref(false);
    const modalReservar = ref(false);
    const modalLiberar = ref(false);
    const modalAjuste = reactive({ visivel: false });
    const modalTransferencia = reactive({ visivel: false });
    const estoqueSelecionado = ref(null);

    const stockService = new StockService();
    const locationService = new StockLocationService();
    const productService = new StockProductService();
    const movementService = new StockMovementService();

    const tiposAjuste = [
      { label: 'Entrada', value: 'entrada' },
      { label: 'Saída', value: 'saida' },
    ];

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

    const sugestoesProdutos = ref([]);
    let timeoutBuscaProdutos = null;

    const formAjuste = ref({
      movement_type: null,
      quantity: null,
      cost: null,
      observation: '',
    });

    const formTransferencia = ref({
      localDestino: null,
      quantidade: null,
      observacao: '',
    });

    const locaisDestino = computed(() => {
      if (!estoqueSelecionado.value) return locais.value;
      return locais.value.filter(l => l.id !== estoqueSelecionado.value.stock_location_id);
    });

    const filtros = ref({
      search: '',
      location_id: null,
      has_available: false,
    });

    const formReserva = ref({
      quantity: null,
      observation: '',
    });

    const formLiberar = ref({
      quantity: null,
      observation: '',
    });

    const formatarQuantidade = (qtd) => {
      return qtd ? parseFloat(qtd).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '0,0000';
    };

    const carregar = async () => {
      try {
        carregando.value = true;
        const params = { 
          per_page: 100 
        };
        
        // Adicionar filtros apenas se tiverem valor
        if (filtros.value.search && filtros.value.search.trim()) {
          params.search = filtros.value.search.trim();
        }
        
        if (filtros.value.location_id) {
          params.location_id = filtros.value.location_id;
        }
        
        // Converter boolean para string 'true'/'false' ou 1/0 para o backend
        if (filtros.value.has_available !== null && filtros.value.has_available !== undefined) {
          params.has_available = filtros.value.has_available ? '1' : '0';
        }
        
        const { data } = await stockService.getAll(params);
        estoques.value = data.data || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar estoque', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };

    const carregarLocais = async () => {
      try {
        const { data } = await locationService.getAll({ per_page: 100 });
        locais.value = data.data || [];
      } catch (error) {
        console.error('Erro ao carregar locais:', error);
      }
    };

    const abrirModalReservar = (estoque) => {
      estoqueSelecionado.value = estoque;
      formReserva.value = {
        quantity: null,
        observation: '',
      };
      modalReservar.value = true;
    };

    const abrirModalLiberar = (estoque) => {
      estoqueSelecionado.value = estoque;
      formLiberar.value = {
        quantity: null,
        observation: '',
      };
      modalLiberar.value = true;
    };

    const reservar = async () => {
      try {
        processando.value = true;
        await stockService.reservar(estoqueSelecionado.value.id, formReserva.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Quantidade reservada com sucesso', life: 3000 });
        modalReservar.value = false;
        await carregar();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao reservar quantidade', life: 3000 });
      } finally {
        processando.value = false;
      }
    };

    const liberar = async () => {
      try {
        processando.value = true;
        await stockService.liberar(estoqueSelecionado.value.id, formLiberar.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Quantidade liberada com sucesso', life: 3000 });
        modalLiberar.value = false;
        await carregar();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao liberar quantidade', life: 3000 });
      } finally {
        processando.value = false;
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

        await movementService.entrada(dados);

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
          detail: `Produto criado com sucesso! Código: ${produtoCriado.code}`,
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

    // Métodos do Modal de Ajuste
    const abrirModalAjuste = (estoque) => {
      estoqueSelecionado.value = estoque;
      formAjuste.value = {
        movement_type: null,
        quantity: null,
        cost: null,
        observation: '',
      };
      modalAjuste.visivel = true;
    };

    const aplicarAjuste = async () => {
      try {
        processando.value = true;
        
        const dados = {
          stock_id: estoqueSelecionado.value.id,
          movement_type: formAjuste.value.movement_type,
          quantity: formAjuste.value.quantity,
          cost: formAjuste.value.cost || null,
          observation: formAjuste.value.observation || null,
        };

        await movementService.ajuste(dados);
        
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Ajuste realizado com sucesso', life: 3000 });
        modalAjuste.visivel = false;
        await carregar();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao aplicar ajuste', life: 3000 });
      } finally {
        processando.value = false;
      }
    };

    // Métodos do Modal de Transferência
    const abrirModalTransferencia = (estoque) => {
      estoqueSelecionado.value = estoque;
      formTransferencia.value = {
        localDestino: null,
        quantidade: null,
        observacao: '',
      };
      modalTransferencia.visivel = true;
    };

    const confirmarTransferencia = async () => {
      if (!formTransferencia.value.localDestino || !formTransferencia.value.quantidade) {
        return;
      }

      if (estoqueSelecionado.value.stock_location_id === formTransferencia.value.localDestino) {
        toast.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'O local de origem e destino devem ser diferentes.',
          life: 3000
        });
        return;
      }

      try {
        processando.value = true;
        
        const dados = {
          stock_id: estoqueSelecionado.value.id,
          to_location_id: formTransferencia.value.localDestino,
          quantity: formTransferencia.value.quantidade,
          observation: formTransferencia.value.observacao || null,
        };

        await movementService.transferir(dados);
        
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Transferência realizada com sucesso', life: 3000 });
        modalTransferencia.visivel = false;
        await carregar();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao realizar transferência', life: 3000 });
      } finally {
        processando.value = false;
      }
    };

    let timeoutCarregar = null;

    const carregarComDebounce = () => {
      if (timeoutCarregar) {
        clearTimeout(timeoutCarregar);
      }
      timeoutCarregar = setTimeout(() => {
        carregar();
      }, 500);
    };

    watch([() => filtros.value.search, () => filtros.value.location_id, () => filtros.value.has_available], () => {
      carregarComDebounce();
    });

    onMounted(() => {
      carregar();
      carregarLocais();
    });

    return {
      estoques,
      locais,
      locaisDestino,
      filtros,
      carregando,
      processando,
      modalReservar,
      modalLiberar,
      modalAjuste,
      modalTransferencia,
      modalEntrada,
      estoqueSelecionado,
      formReserva,
      formLiberar,
      formAjuste,
      formTransferencia,
      tiposAjuste,
      sugestoesProdutos,
      formatarQuantidade,
      abrirModalReservar,
      abrirModalLiberar,
      reservar,
      liberar,
      abrirModalEntrada,
      fecharModalEntrada,
      buscarProdutos,
      confirmarEntrada,
      modalCriarProduto,
      abrirModalCriarProduto,
      fecharModalCriarProduto,
      confirmarCriarProduto,
      abrirModalAjuste,
      aplicarAjuste,
      abrirModalTransferencia,
      confirmarTransferencia,
    };
  },
};
</script>

