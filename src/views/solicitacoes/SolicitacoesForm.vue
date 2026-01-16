<template>
  <div class="card p-5">
    <!-- Cabeçalho -->
    <div class="flex align-items-center mb-4">
      <Button icon="pi pi-arrow-left" class="p-button-text mr-2" @click="voltar" />
      <h4 class="m-0">Cadastro de Solicitação</h4>
    </div>

    <!-- Identificação -->
    <h5 class="mb-3 text-900">Identificação da Solicitação</h5>

    <div class="grid">
      <div class="col-12 md:col-3">
        <label class="block text-600 mb-2">Número da solicitação</label>
        <InputText v-model="form.numero" class="w-full" disabled placeholder="Gerado automaticamente" />
      </div>

      <div class="col-12 md:col-3">
        <label class="block text-600 mb-2">Data da Solicitação</label>
        <Calendar v-model="form.data" dateFormat="dd/mm/yy" class="w-full" :disabled="true" />
      </div>


      <div class="col-12 md:col-6">
        <label class="block text-600 mb-2">Local</label>
        <InputText v-model="form.local" class="w-full" />
      </div>
    </div>

    <!-- Itens -->
    <div class="mt-4">
      <div class="flex justify-content-between align-items-center mb-2">
        <div class="flex gap-2">
          <Button label="Adicionar item" icon="pi pi-plus" class="p-button-text p-button-success" @click="abrirModalProdutos" />
          <Button label="Consultar Estoque" icon="pi pi-search" class="p-button-text p-button-info" @click="abrirModalEstoque" />
        </div>
      </div>

      <DataTable :value="form.itens" class="p-datatable-sm tabela-itens" responsiveLayout="scroll">
        <Column field="codigo" header="Código">
          <template #body="{ data }">
            {{ data.codigo }}
          </template>
        </Column>

        <Column field="referencia" header="Referência">
          <template #body="{ data }">
            <InputText v-model="data.referencia" class="w-full p-inputtext-sm" />
          </template>
        </Column>

        <Column field="mercadoria" header="Mercadoria">
          <template #body="{ data }">
            <InputText v-model="data.mercadoria" class="w-full p-inputtext-sm" />
          </template>
        </Column>

        <Column field="quantidade" header="Quant solicitada">
          <template #body="{ data }">
            <InputNumber v-model="data.quantidade" class="w-full p-inputtext-sm" />
          </template>
        </Column>

        <Column field="unidade" header="Medida">
          <template #body="{ data }">
            <InputText v-model="data.unidade" class="w-full p-inputtext-sm" />
          </template>
        </Column>

        <Column field="aplicacao" header="Aplicação">
          <template #body="{ data }">
            <InputText v-model="data.aplicacao" class="w-full p-inputtext-sm" />
          </template>
        </Column>

        <Column field="prioridade" header="Prioridade dias">
          <template #body="{ data }">
            <InputNumber v-model="data.prioridade" class="w-full p-inputtext-sm" />
          </template>
        </Column>

        <Column field="tag" header="TAG">
          <template #body="{ data }">
            <InputText v-model="data.tag" class="w-full p-inputtext-sm" />
          </template>
        </Column>

        <Column field="centroCusto" header="Centro de custo">
          <template #body="{ data, index }">
            <div class="p-inputgroup centro-custo-input">
              <InputText
                  :value="centroCustoLabel(data.centroCusto)"
                  placeholder="Selecione o centro de custo"
                  readonly
                  class="w-full p-inputtext-sm"
              />
              <Button
                  icon="pi pi-search"
                  class="p-button-outlined p-button-sm"
                  @click="abrirModalCentroCusto(index)"
              />
              <Button
                  v-if="data.centroCusto"
                  icon="pi pi-times"
                  class="p-button-outlined p-button-danger p-button-sm"
                  @click="limparCentroCusto(index)"
              />
            </div>
          </template>
        </Column>

        <Column header="" style="width:4rem; text-align:center">
          <template #body="slotProps">
            <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="removerItem(slotProps.index)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Observação -->
    <div class="mt-5">
      <label class="block text-600 mb-2">Observação</label>
      <Textarea v-model="form.observacao" rows="3" class="w-full" placeholder="Your Message" />
    </div>

    <!-- Botões -->
    <div class="flex justify-content-end mt-4">
      <Button label="Cancelar" class="p-button-text mr-2" @click="voltar" />
      <Button label="Salvar" icon="pi pi-check" class="p-button-success" :loading="isSaving" :disabled="isSaving" @click="salvar" />
    </div>

    <!-- Modal de seleção de produto -->
    <Dialog v-model:visible="modalProdutos.visivel" modal header="Selecionar produto" :style="{ width: '60vw', maxWidth: '900px' }" appendTo="body">
      <div class="mb-3">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText v-model="modalProdutos.busca" placeholder="Buscar (código, descrição...)" class="w-full" @input="onPesquisarProdutos" />
        </span>
      </div>

      <DataTable
          :value="modalProdutos.items"
          selectionMode="single"
          v-model:selection="modalProdutos.selection"
          :loading="modalProdutos.loading"
          dataKey="B1_COD"
          class="p-datatable-sm"
          paginator
          :rows="modalProdutos.perPage"
          :totalRecords="modalProdutos.total"
          :rowsPerPageOptions="[10, 20, 50]"
          lazy
          :first="(modalProdutos.page - 1) * modalProdutos.perPage"
          @page="onProdutosPage"
          responsiveLayout="scroll"
      >
        <Column selectionMode="single" headerStyle="width:3rem"></Column>
        <Column field="B1_COD" header="Código" sortable />
        <Column field="B1_DESC" header="Descrição" sortable />
        <Column field="B1_UM" header="Unidade de medida" sortable />
      </DataTable>

      <template #footer>
        <div class="flex justify-content-between align-items-center mt-3">
          <Button 
            label="Cadastrar Produto" 
            icon="pi pi-plus" 
            class="p-button-outlined p-button-success" 
            @click="abrirModalCadastroProduto" 
          />
          <div class="flex gap-2">
            <Button label="Cancelar" class="p-button-text" @click="fecharModalProdutos" />
            <Button label="Selecionar" class="p-button-success" @click="adicionarProduto" :disabled="!modalProdutos.selection" />
          </div>
        </div>
      </template>
    </Dialog>

    <!-- Modal de Cadastro de Produto -->
    <Dialog 
      v-model:visible="modalCadastroProduto.visivel" 
      modal 
      header="Cadastrar Novo Produto" 
      :style="{ width: '50vw', maxWidth: '700px' }" 
      appendTo="body"
    >
      <div class="grid formgrid">
        <div class="col-12">
          <label class="block text-600 mb-2">Descrição <span class="text-red-500">*</span></label>
          <InputText 
            v-model="modalCadastroProduto.form.description" 
            placeholder="Digite a descrição do produto" 
            class="w-full" 
            :disabled="modalCadastroProduto.saving"
          />
          <small class="text-500">O código será gerado automaticamente pelo sistema</small>
        </div>

        <div class="col-12 md:col-6">
          <label class="block text-600 mb-2">Referência</label>
          <InputText 
            v-model="modalCadastroProduto.form.reference" 
            placeholder="Referência do produto" 
            class="w-full" 
            :disabled="modalCadastroProduto.saving"
          />
        </div>

        <div class="col-12 md:col-6">
          <label class="block text-600 mb-2">Unidade de Medida <span class="text-red-500">*</span></label>
          <InputText 
            v-model="modalCadastroProduto.form.unit" 
            placeholder="Ex: UN, KG, PC" 
            class="w-full" 
            :disabled="modalCadastroProduto.saving"
          />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-content-end gap-2 mt-3">
          <Button 
            label="Cancelar" 
            class="p-button-text" 
            @click="fecharModalCadastroProduto" 
            :disabled="modalCadastroProduto.saving"
          />
          <Button 
            label="Cadastrar e Selecionar" 
            icon="pi pi-check" 
            class="p-button-success" 
            @click="cadastrarProduto" 
            :loading="modalCadastroProduto.saving"
            :disabled="modalCadastroProduto.saving || !validarFormProduto()"
          />
        </div>
      </template>
    </Dialog>

    <!-- Modal de Consulta de Estoque e Reserva -->
    <Dialog v-model:visible="modalEstoque.visivel" modal header="Consultar Estoque e Reservar Produtos" :style="{ width: '80vw', maxWidth: '1200px' }" appendTo="body">
      <div class="mb-3">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText v-model="modalEstoque.busca" placeholder="Buscar produto (código, descrição...)" class="w-full" @input="onPesquisarEstoque" />
        </span>
      </div>

      <DataTable
          :value="modalEstoque.items"
          :loading="modalEstoque.loading"
          dataKey="id"
          class="p-datatable-sm"
          paginator
          :rows="modalEstoque.perPage"
          :totalRecords="modalEstoque.total"
          :rowsPerPageOptions="[10, 20, 50]"
          lazy
          :first="(modalEstoque.page - 1) * modalEstoque.perPage"
          @page="onEstoquePage"
          responsiveLayout="scroll"
          v-model:expandedRows="modalEstoque.expandedRows"
          rowHover
      >
        <Column :expander="true" headerStyle="width:3rem" />
        <Column field="code" header="Código" sortable />
        <Column field="description" header="Descrição" sortable />
        <Column field="unit" header="Unidade" sortable />
        <Column header="Total Disponível" sortable sortField="total_available">
          <template #body="{ data }">
            <span class="font-semibold text-green-600">{{ data.total_available || 0 }}</span>
          </template>
        </Column>
        <Column header="Ações" headerStyle="width:10rem">
          <template #body="{ data }">
            <Button 
              label="Reservar" 
              icon="pi pi-lock" 
              class="p-button-sm p-button-success" 
              :disabled="!data.total_available || data.total_available <= 0"
              @click="abrirModalReservar(data)"
            />
          </template>
        </Column>
        
        <template #expansion="slotProps">
          <div class="p-3">
            <h5 class="mb-3">Locais de Estoque</h5>
            <div v-if="slotProps.data.locations && slotProps.data.locations.length > 0">
              <DataTable :value="slotProps.data.locations" class="p-datatable-sm">
                <Column field="location_code" header="Código do Local">
                  <template #body="{ data }">
                    <span class="font-semibold">{{ data.location_code || '-' }}</span>
                  </template>
                </Column>
                <Column field="location_name" header="Nome do Local">
                  <template #body="{ data }">
                    {{ data.location_name || '-' }}
                  </template>
                </Column>
                <Column header="Disponível" sortable sortField="quantity_available">
                  <template #body="{ data }">
                    <span class="text-green-600 font-semibold">{{ data.quantity_available || 0 }}</span>
                  </template>
                </Column>
                <Column header="Reservado" sortable sortField="quantity_reserved">
                  <template #body="{ data }">
                    <span class="text-orange-600">{{ data.quantity_reserved || 0 }}</span>
                  </template>
                </Column>
                <Column header="Total" sortable sortField="quantity_total">
                  <template #body="{ data }">
                    <span>{{ data.quantity_total || 0 }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>
            <div v-else class="text-center text-500 py-3">
              Nenhum local de estoque encontrado para este produto.
            </div>
          </div>
        </template>
      </DataTable>

      <template #footer>
        <div class="flex justify-content-end mt-3">
          <Button label="Fechar" class="p-button-text" @click="fecharModalEstoque" />
        </div>
      </template>
    </Dialog>

    <!-- Modal de Reserva -->
    <Dialog v-model:visible="modalReservar.visivel" modal header="Reservar Produto" :style="{ width: '550px' }" appendTo="body">
      <div class="mb-4">
        <div class="mb-3">
          <label class="block text-600 mb-2">Produto</label>
          <div class="text-900 font-semibold">{{ modalReservar.produto?.description }}</div>
          <div class="text-600 text-sm">Código: {{ modalReservar.produto?.code }}</div>
        </div>
        
        <div class="mb-3" v-if="modalReservar.produto?.locations && modalReservar.produto.locations.length > 1">
          <label class="block text-600 mb-2">Local *</label>
          <Dropdown 
            v-model="modalReservar.localSelecionado" 
            :options="modalReservar.produto.locations"
            optionLabel="location_name"
            placeholder="Selecione o local"
            class="w-full"
            :filter="true"
          >
            <template #option="slotProps">
              <div class="flex justify-content-between align-items-center">
                <div>
                  <div class="font-semibold">{{ slotProps.option.location_code }} - {{ slotProps.option.location_name }}</div>
                  <div class="text-sm text-500">Disponível: {{ slotProps.option.quantity_available }}</div>
                </div>
              </div>
            </template>
          </Dropdown>
        </div>
        <div class="mb-3" v-else-if="modalReservar.produto?.locations && modalReservar.produto.locations.length === 1">
          <label class="block text-600 mb-2">Local</label>
          <div class="text-900">
            {{ modalReservar.produto.locations[0].location_code }} - {{ modalReservar.produto.locations[0].location_name }}
            <span class="text-green-600 ml-2">({{ modalReservar.produto.locations[0].quantity_available }} disponível)</span>
          </div>
        </div>
        
        <div class="mb-3">
          <label class="block text-600 mb-2">Quantidade Disponível</label>
          <div class="text-green-600 font-semibold text-lg">
            {{ modalReservar.quantidadeDisponivelLocal || modalReservar.produto?.total_available || 0 }}
          </div>
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Quantidade a Reservar *</label>
          <InputNumber 
            v-model="modalReservar.quantidade" 
            :min="0.01" 
            :max="modalReservar.quantidadeDisponivelLocal || modalReservar.produto?.total_available || 0"
            :step="0.01"
            class="w-full"
            :useGrouping="false"
          />
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Observação</label>
          <Textarea v-model="modalReservar.observacao" rows="3" class="w-full" placeholder="Informe uma observação para a reserva..." />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-content-end gap-2">
          <Button label="Cancelar" class="p-button-text" @click="fecharModalReservar" />
          <Button 
            label="Confirmar Reserva" 
            icon="pi pi-check" 
            class="p-button-success" 
            :disabled="!modalReservar.quantidade || modalReservar.quantidade <= 0 || (modalReservar.produto?.locations?.length > 1 && !modalReservar.localSelecionado)"
            :loading="modalReservar.loading"
            @click="confirmarReserva"
          />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="modalCentro.visivel" modal header="Selecionar centro de custo" :style="{ width: '50vw', maxWidth: '800px' }" appendTo="body">
      <div class="mb-3">
                <span class="p-input-icon-left w-full">
                    <i class="pi pi-search" />
          <InputText v-model="modalCentro.busca" placeholder="Buscar (código, descrição...)" class="w-full" @input="onPesquisarCentroCusto" />
                </span>
      </div>

      <DataTable
          :value="modalCentro.items"
          selectionMode="single"
          v-model:selection="modalCentro.selection"
          :loading="modalCentro.loading"
          dataKey="CTT_CUSTO"
          paginator
          :rows="modalCentro.perPage"
          :totalRecords="modalCentro.total"
          :rowsPerPageOptions="[10, 20, 50]"
          lazy
          :first="(modalCentro.page - 1) * modalCentro.perPage"
          @page="onCentroCustoPage"
          class="p-datatable-sm"
          responsiveLayout="scroll"
      >
        <Column selectionMode="single" headerStyle="width:3rem"></Column>
        <Column field="CTT_CUSTO" header="Código" sortable />
        <Column field="CTT_DESC01" header="Descrição" sortable />
        <Column field="CTT_CLASSE" header="Classe" sortable />
      </DataTable>

      <template #footer>
        <div class="flex justify-content-end mt-3">
          <Button label="Cancelar" class="p-button-text" @click="fecharModalCentroCusto" />
          <Button label="Selecionar" class="p-button-success" @click="confirmarCentroCusto" :disabled="!modalCentro.selection" />
        </div>
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import ProtheusService from '@/service/ProtheusService';
import SolicitacaoService from '@/service/SolicitacaoService';
import StockProductService from '@/service/StockProductService';
import StockService from '@/service/StockService';

export default {
  name: 'CadastroSolicitacao',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const store = useStore();
    const protheusService = new ProtheusService();
    const solicitacaoService = SolicitacaoService;
    const stockProductService = new StockProductService();
    const stockService = new StockService();

    const form = ref({
      numero: null,
      data: new Date(), // Data atual automaticamente
      solicitante: null,
      empresa: null,
      local: '',
      workFront: '',
      observacao: '',
      itens: []
    });

    // Inicializar solicitante e empresa automaticamente com dados do usuário logado
    onMounted(() => {
      const usuario = store.state.usuario;
      const company = store.state.company;
      
      if (usuario) {
        // Associar automaticamente o solicitante (usuário logado)
        form.value.solicitante = usuario.nome_completo || usuario.name || usuario.login;
      }
      
      if (company) {
        // Associar automaticamente a empresa (empresa selecionada do usuário)
        form.value.empresa = company.company || company.name || company.id;
      }
    });

    const modalProdutos = reactive({
      visivel: false,
      busca: '',
      selection: null,
      items: [],
      page: 1,
      perPage: 10,
      total: 0,
      loading: false,
      lastPage: 1
    });

    const modalCentro = reactive({
      visivel: false,
      busca: '',
      selection: null,
      itemIndex: null,
      items: [],
      page: 1,
      perPage: 10,
      total: 0,
      loading: false,
      lastPage: 1
    });

    const ultimoCentroCustoSelecionado = ref(null);

    const modalEstoque = reactive({
      visivel: false,
      busca: '',
      items: [],
      page: 1,
      perPage: 10,
      total: 0,
      loading: false,
      lastPage: 1,
      expandedRows: []
    });

    const modalReservar = reactive({
      visivel: false,
      produto: null,
      localSelecionado: null,
      quantidade: null,
      observacao: '',
      loading: false,
      get quantidadeDisponivelLocal() {
        if (this.localSelecionado) {
          return this.localSelecionado.quantity_available || 0;
        }
        if (this.produto?.locations && this.produto.locations.length === 1) {
          return this.produto.locations[0].quantity_available || 0;
        }
        return this.produto?.total_available || 0;
      }
    });

    const modalCadastroProduto = reactive({
      visivel: false,
      saving: false,
      form: {
        description: '',
        reference: '',
        unit: 'UN'
      }
    });

    let buscaProdutoTimeout = null;
    let buscaCentroTimeout = null;
    let buscaEstoqueTimeout = null;

    const fetchProdutos = async () => {
      try {
        modalProdutos.loading = true;

        const params = {
          page: modalProdutos.page,
          per_page: modalProdutos.perPage
        };

        const busca = modalProdutos.busca.trim();
        if (busca) {
          params.busca = busca;
        }

        // Usar novo endpoint que combina Protheus + Sistema Interno
        const response = await stockProductService.buscarCombinado(params);
        const payload = response?.data ?? {};
        const data = payload?.data ?? [];

        modalProdutos.items = Array.isArray(data) ? data : [];

        const pagination = payload?.pagination ?? {};

        modalProdutos.total = pagination?.total ?? modalProdutos.items.length;
        modalProdutos.page = pagination?.current_page ?? params.page ?? 1;
        modalProdutos.perPage = pagination?.per_page ?? params.per_page ?? modalProdutos.perPage;
        modalProdutos.lastPage = pagination?.last_page ?? Math.max(1, Math.ceil((modalProdutos.total || 0) / modalProdutos.perPage));

        if (modalProdutos.selection?.B1_COD) {
          const match = modalProdutos.items.find(item => item.B1_COD === modalProdutos.selection.B1_COD);
          if (match) {
            modalProdutos.selection = match;
          }
        }
      } catch (error) {
        console.error('Erro ao buscar produtos', error);
        toast.add({
          severity: 'error',
          summary: 'Erro ao carregar produtos',
          detail: error?.response?.data?.message || 'Não foi possível obter os produtos.',
          life: 4000
        });
      } finally {
        modalProdutos.loading = false;
      }
    };

    const abrirModalProdutos = () => {
      modalProdutos.visivel = true;
      modalProdutos.page = 1;
      fetchProdutos();
    };

    const fecharModalProdutos = () => {
      modalProdutos.visivel = false;
    };

    const onPesquisarProdutos = () => {
      if (buscaProdutoTimeout) {
        clearTimeout(buscaProdutoTimeout);
      }
      buscaProdutoTimeout = setTimeout(() => {
        modalProdutos.page = 1;
        fetchProdutos();
      }, 400);
    };

    const onProdutosPage = event => {
      modalProdutos.page = event.page + 1;
      modalProdutos.perPage = event.rows;
      fetchProdutos();
    };

    const adicionarProduto = () => {
      const p = modalProdutos.selection;
      if (!p) return;
      const novoItem = {
        codigo: p.B1_COD || '',
        referencia: 'NBK-2025',
        mercadoria: p.B1_DESC || '',
        quantidade: 1,
        unidade: p.B1_UM || '',
        aplicacao: 'Substituição e melhoria',
        prioridade: 7,
        tag: 'TAG-101',
        centroCusto: ultimoCentroCustoSelecionado.value ? { ...ultimoCentroCustoSelecionado.value } : null
      };

      form.value.itens.push(novoItem);
      toast.add({ severity: 'success', summary: 'Item adicionado', detail: p.B1_DESC || p.B1_COD, life: 2000 });
      modalProdutos.visivel = false;
      modalProdutos.selection = null;
    };

    const abrirModalCadastroProduto = () => {
      modalCadastroProduto.form = {
        description: modalProdutos.busca || '',
        reference: '',
        unit: 'UN'
      };
      modalCadastroProduto.visivel = true;
    };

    const fecharModalCadastroProduto = () => {
      modalCadastroProduto.visivel = false;
      modalCadastroProduto.form = {
        description: '',
        reference: '',
        unit: 'UN'
      };
    };

    const validarFormProduto = () => {
      return modalCadastroProduto.form.description?.trim() && 
             modalCadastroProduto.form.unit?.trim();
    };

    const cadastrarProduto = async () => {
      if (!validarFormProduto()) {
        toast.add({
          severity: 'warn',
          summary: 'Campos obrigatórios',
          detail: 'Preencha todos os campos obrigatórios (Descrição e Unidade)',
          life: 3000
        });
        return;
      }

      try {
        modalCadastroProduto.saving = true;

        // Cadastrar produto no sistema e no Protheus
        const response = await stockProductService.saveWithProtheus(modalCadastroProduto.form);

        const produto = response.data?.data || response.data;

        // Adicionar o produto à lista de produtos do modal (formato Protheus)
        const produtoProtheus = {
          B1_COD: produto.code,
          B1_DESC: produto.description,
          B1_UM: produto.unit,
          source: 'internal',
          internal_id: produto.id
        };

        // Selecionar automaticamente o produto cadastrado
        modalProdutos.selection = produtoProtheus;

        // Fechar modal de cadastro
        fecharModalCadastroProduto();

        // Atualizar lista de produtos para incluir o recém-cadastrado
        await fetchProdutos();

        // Verificar se o produto está na lista atual, se não estiver, adicionar manualmente
        const produtoNaLista = modalProdutos.items.find(item => item.B1_COD === produto.code);
        if (!produtoNaLista) {
          modalProdutos.items.unshift(produtoProtheus);
        }

        // Garantir que o produto está selecionado após atualizar a lista
        const produtoAtualizado = modalProdutos.items.find(item => item.B1_COD === produto.code);
        if (produtoAtualizado) {
          modalProdutos.selection = produtoAtualizado;
        }

        // Adicionar o produto automaticamente à solicitação
        adicionarProduto();

        toast.add({
          severity: 'success',
          summary: 'Produto cadastrado e adicionado',
          detail: `Produto ${produto.code} cadastrado e adicionado à solicitação!`,
          life: 3000
        });
      } catch (error) {
        console.error('Erro ao cadastrar produto', error);
        toast.add({
          severity: 'error',
          summary: 'Erro ao cadastrar produto',
          detail: error?.response?.data?.message || error?.response?.data?.error || 'Não foi possível cadastrar o produto.',
          life: 4000
        });
      } finally {
        modalCadastroProduto.saving = false;
      }
    };

    const fetchCentrosCusto = async () => {
      try {
        modalCentro.loading = true;

        const params = {
          page: modalCentro.page,
          per_page: modalCentro.perPage
        };

        const busca = modalCentro.busca.trim();
        if (busca) {
          params.busca = busca;
        }

        const response = await protheusService.getCentrosCusto(params);
        const payload = response?.data ?? {};
        const data = payload?.data ?? payload;

        modalCentro.items = data?.items ?? data?.centros ?? [];

        const pagination = data?.pagination ?? payload?.pagination ?? {};

        modalCentro.total = pagination?.total ?? data?.total ?? modalCentro.items.length;
        modalCentro.page = pagination?.current_page ?? params.page ?? 1;
        modalCentro.perPage = pagination?.per_page ?? params.per_page ?? modalCentro.perPage;
        modalCentro.lastPage = pagination?.last_page ?? Math.max(1, Math.ceil((modalCentro.total || 0) / modalCentro.perPage));
      } catch (error) {
        console.error('Erro ao buscar centros de custo do Protheus', error);
        toast.add({
          severity: 'error',
          summary: 'Erro ao carregar centros de custo',
          detail: error?.response?.data?.message || 'Não foi possível obter os centros de custo do Protheus.',
          life: 4000
        });
      } finally {
        modalCentro.loading = false;
      }
    };

    const abrirModalCentroCusto = index => {
      modalCentro.itemIndex = index;
      modalCentro.visivel = true;
      modalCentro.page = 1;
      modalCentro.selection = form.value.itens[index]?.centroCusto ? { ...form.value.itens[index].centroCusto } : null;
      fetchCentrosCusto();
    };

    const fecharModalCentroCusto = () => {
      modalCentro.visivel = false;
      modalCentro.itemIndex = null;
      modalCentro.selection = null;
    };

    const onPesquisarCentroCusto = () => {
      if (buscaCentroTimeout) {
        clearTimeout(buscaCentroTimeout);
      }
      buscaCentroTimeout = setTimeout(() => {
        modalCentro.page = 1;
        fetchCentrosCusto();
      }, 400);
    };

    const onCentroCustoPage = event => {
      modalCentro.page = event.page + 1;
      modalCentro.perPage = event.rows;
      fetchCentrosCusto();
    };

    const confirmarCentroCusto = () => {
      if (!modalCentro.selection) {
        return;
      }

      ultimoCentroCustoSelecionado.value = { ...modalCentro.selection };

      form.value.itens.forEach((item, idx) => {
        if (idx === modalCentro.itemIndex || item.centroCusto === null) {
          item.centroCusto = { ...modalCentro.selection };
        }
      });

      toast.add({
        severity: 'success',
        summary: 'Centro de custo aplicado',
        detail: modalCentro.selection.CTT_DESC01 || modalCentro.selection.CTT_CUSTO,
        life: 2000
      });

      fecharModalCentroCusto();
    };

    const limparCentroCusto = index => {
      form.value.itens[index].centroCusto = null;
    };

    const centroCustoLabel = centro => {
      if (!centro) return '';

      const codigo = centro.CTT_CUSTO ?? '';
      const descricao = centro.CTT_DESC01 ?? '';

      if (codigo && descricao) {
        return `${codigo} - ${descricao}`;
      }

      return codigo || descricao;
    };

    const removerItem = index => {
      form.value.itens.splice(index, 1);
      toast.add({ severity: 'warn', summary: 'Item removido', life: 1500 });
    };

    // Métodos do Modal de Estoque
    const abrirModalEstoque = () => {
      modalEstoque.visivel = true;
      modalEstoque.page = 1;
      modalEstoque.busca = '';
      modalEstoque.expandedRows = [];
      fetchProdutosEstoque();
    };

    const fecharModalEstoque = () => {
      modalEstoque.visivel = false;
      modalEstoque.items = [];
      modalEstoque.expandedRows = [];
    };

    const fetchProdutosEstoque = async () => {
      try {
        modalEstoque.loading = true;

        const params = {
          page: modalEstoque.page,
          per_page: modalEstoque.perPage
        };

        const busca = modalEstoque.busca.trim();
        if (busca) {
          params.search = busca;
        }

        const response = await stockProductService.buscar(params);
        const responseData = response?.data ?? {};
        const data = responseData?.data ?? [];
        const pagination = responseData?.pagination ?? {};

        // Calcular total disponível para cada produto
        const produtosComTotal = Array.isArray(data) ? data.map(produto => {
          const totalAvailable = produto.locations && Array.isArray(produto.locations)
            ? produto.locations.reduce((sum, loc) => sum + (parseFloat(loc.quantity_available) || 0), 0)
            : 0;
          
          return {
            ...produto,
            total_available: totalAvailable,
            locations: produto.locations || []
          };
        }) : [];

        modalEstoque.items = produtosComTotal;
        modalEstoque.total = pagination?.total ?? 0;
        modalEstoque.page = pagination?.current_page ?? params.page ?? 1;
        modalEstoque.perPage = pagination?.per_page ?? params.per_page ?? modalEstoque.perPage;
        modalEstoque.lastPage = pagination?.last_page ?? Math.max(1, Math.ceil((modalEstoque.total || 0) / modalEstoque.perPage));
      } catch (error) {
        console.error('Erro ao buscar produtos em estoque', error);
        toast.add({
          severity: 'error',
          summary: 'Erro ao carregar estoque',
          detail: error?.response?.data?.message || 'Não foi possível buscar produtos em estoque.',
          life: 4000
        });
        modalEstoque.items = [];
      } finally {
        modalEstoque.loading = false;
      }
    };

    const onPesquisarEstoque = () => {
      if (buscaEstoqueTimeout) {
        clearTimeout(buscaEstoqueTimeout);
      }
      buscaEstoqueTimeout = setTimeout(() => {
        modalEstoque.page = 1;
        fetchProdutosEstoque();
      }, 400);
    };

    const onEstoquePage = (event) => {
      // O PrimeVue DataTable usa índice baseado em 0, então page é 0 para primeira página
      modalEstoque.page = event.page + 1;
      modalEstoque.perPage = event.rows;
      fetchProdutosEstoque();
    };

    // Métodos do Modal de Reserva
    const abrirModalReservar = (produto) => {
      if (!produto.locations || produto.locations.length === 0) {
        toast.add({
          severity: 'warn',
          summary: 'Sem estoque',
          detail: 'Este produto não possui estoque disponível.',
          life: 3000
        });
        return;
      }

      modalReservar.visivel = true;
      modalReservar.produto = produto;
      
      // Se houver apenas um local, selecionar automaticamente
      if (produto.locations.length === 1) {
        modalReservar.localSelecionado = produto.locations[0];
      } else {
        modalReservar.localSelecionado = null;
      }
      
      modalReservar.quantidade = null;
      modalReservar.observacao = '';
    };

    const fecharModalReservar = () => {
      modalReservar.visivel = false;
      modalReservar.produto = null;
      modalReservar.localSelecionado = null;
      modalReservar.quantidade = null;
      modalReservar.observacao = '';
    };

    const confirmarReserva = async () => {
      if (!modalReservar.produto || !modalReservar.quantidade || modalReservar.quantidade <= 0) {
        return;
      }

      if (!modalReservar.produto.locations || modalReservar.produto.locations.length === 0) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Não foi possível localizar o estoque do produto.',
          life: 3000
        });
        return;
      }

      // Buscar o stock_id do primeiro local com estoque disponível
      try {
        modalReservar.loading = true;

        if (!modalReservar.produto.locations || modalReservar.produto.locations.length === 0) {
          toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Não foi possível localizar o estoque do produto.',
            life: 3000
          });
          return;
        }

        // Determinar qual local usar
        let locationComEstoque;
        
        if (modalReservar.produto.locations.length === 1) {
          // Se houver apenas um local, usar ele
          locationComEstoque = modalReservar.produto.locations[0];
        } else if (modalReservar.localSelecionado) {
          // Se houver múltiplos locais e um foi selecionado, usar o selecionado
          locationComEstoque = modalReservar.localSelecionado;
        } else {
          toast.add({
            severity: 'warn',
            summary: 'Local não selecionado',
            detail: 'Por favor, selecione um local para a reserva.',
            life: 3000
          });
          return;
        }

        // Verificar se há estoque suficiente no local selecionado
        if (locationComEstoque.quantity_available < modalReservar.quantidade) {
          toast.add({
            severity: 'warn',
            summary: 'Estoque insuficiente',
            detail: `O local selecionado possui apenas ${locationComEstoque.quantity_available} unidade(s) disponível(is).`,
            life: 3000
          });
          return;
        }

        if (!locationComEstoque.stock_id) {
          toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'ID do estoque não encontrado. Por favor, tente novamente.',
            life: 3000
          });
          return;
        }

        const stockId = locationComEstoque.stock_id;
        
        const reservaData = {
          quantity: modalReservar.quantidade,
          observation: modalReservar.observacao || `Reserva solicitada via sistema`
        };

        await stockService.reservar(stockId, reservaData);

        toast.add({
          severity: 'success',
          summary: 'Reserva realizada',
          detail: `${modalReservar.quantidade} unidade(s) do produto "${modalReservar.produto.description}" foram reservadas com sucesso.`,
          life: 4000
        });

        // Atualizar lista de estoque
        fetchProdutosEstoque();
        
        fecharModalReservar();
      } catch (error) {
        console.error('Erro ao reservar produto', error);
        toast.add({
          severity: 'error',
          summary: 'Erro ao reservar',
          detail: error?.response?.data?.message || 'Não foi possível realizar a reserva.',
          life: 4000
        });
      } finally {
        modalReservar.loading = false;
      }
    };

    const voltar = () => router.push('/solicitacoes');
    const salvar = async () => {
      if (isSaving.value) {
        return;
      }

      if (!form.value.itens.length) {
        toast.add({ severity: 'warn', summary: 'Itens obrigatórios', detail: 'Adicione ao menos um item antes de salvar.', life: 3000 });
        return;
      }

      isSaving.value = true;

      const formatDate = (value) => {
        if (!value) return null;
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) {
          return null;
        }
        return date.toISOString().slice(0, 10);
      };

      // Obter dados do usuário e empresa do store
      const usuario = store.state.usuario;
      const company = store.state.company;
      
      const payload = {
        numero: form.value.numero,
        data_solicitacao: formatDate(form.value.data),
        solicitante: {
          id: usuario?.id || null,
          label: form.value.solicitante || usuario?.nome_completo || usuario?.name || usuario?.login || ''
        },
        empresa: {
          id: company?.id || null,
          label: form.value.empresa || company?.company || company?.name || ''
        },
        local: form.value.local || null,
        work_front: form.value.workFront || null,
        observacao: form.value.observacao || null,
        itens: form.value.itens.map((item) => ({
          codigo: item.codigo || null,
          referencia: item.referencia || null,
          mercadoria: item.mercadoria,
          quantidade: item.quantidade || 0,
          unidade: item.unidade || null,
          aplicacao: item.aplicacao || null,
          prioridade: item.prioridade || null,
          tag: item.tag || null,
          centro_custo: item.centroCusto
            ? {
              codigo: item.centroCusto.CTT_CUSTO,
              descricao: item.centroCusto.CTT_DESC01,
              classe: item.centroCusto.CTT_CLASSE,
            }
            : null,
        })),
      };

      try {
        const { data } = await SolicitacaoService.create(payload);

        toast.add({
          severity: 'success',
          summary: 'Solicitação salva!',
          detail: `Cotação ${data?.data?.numero ?? ''} registrada com sucesso.`,
          life: 3000,
        });

        router.push({ name: 'solicitacoesList' });
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível salvar a solicitação.';
        toast.add({ severity: 'error', summary: 'Erro ao salvar', detail, life: 4000 });
      } finally {
        isSaving.value = false;
      }
    };

    const isSaving = ref(false);

    return {
      form,
      modalProdutos,
      modalEstoque,
      modalReservar,
      modalCentro,
      modalCadastroProduto,
      centroCustoLabel,
      onPesquisarProdutos,
      onProdutosPage,
      abrirModalProdutos,
      fecharModalProdutos,
      adicionarProduto,
      abrirModalEstoque,
      fecharModalEstoque,
      onPesquisarEstoque,
      onEstoquePage,
      abrirModalReservar,
      fecharModalReservar,
      confirmarReserva,
      abrirModalCentroCusto,
      fecharModalCentroCusto,
      onPesquisarCentroCusto,
      onCentroCustoPage,
      confirmarCentroCusto,
      limparCentroCusto,
      removerItem,
      voltar,
      salvar,
      isSaving,
      abrirModalCadastroProduto,
      fecharModalCadastroProduto,
      cadastrarProduto,
      validarFormProduto
    };
  }
};
</script>

<style scoped>
.card {
  border-radius: 10px;
  background: #fff;
}

/* Estilo igual ao print */
.tabela-itens :deep(.p-datatable-thead > tr > th) {
  background-color: #f5fcf6;
  color: #333;
  font-weight: 500;
  border: 1px solid #eaeaea;
}
.tabela-itens :deep(.p-datatable-tbody > tr > td) {
  background-color: #fbfefb;
  border: 1px solid #f0f0f0;
}
.tabela-itens :deep(.p-inputtext) {
  border: none !important;
  background: transparent !important;
  font-size: 0.9rem;
  color: #333;
}
.tabela-itens :deep(.p-inputtext:focus) {
  box-shadow: none !important;
  border-bottom: 1px solid #3aa55d !important;
}
.centro-custo-input :deep(.p-inputtext) {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.centro-custo-input :deep(.p-button) {
  flex: 0 0 auto;
}
::deep(.p-button-text.p-button-success) {
  color: #28a745 !important;
  background: none !important;
  border: 1px solid #28a745 !important;
  font-weight: 500;
}
</style>
