<template>
  <div class="card p-5 bg-page">
    <h5 class="text-900 mb-3">Nova Nota Fiscal e Entrada no Estoque</h5>

    <form @submit.prevent="salvar">
      <!-- Dados da Nota Fiscal -->
      <div class="card mb-4">
        <h6 class="text-900 mb-3">Dados da Nota Fiscal</h6>
        <div class="grid">
          <div class="col-12 md:col-4">
            <label>Número da Nota Fiscal *</label>
            <InputText v-model="form.invoice_number" class="w-full" required />
          </div>
          <div class="col-12 md:col-4">
            <label>Série</label>
            <InputText v-model="form.invoice_series" class="w-full" />
          </div>
          <div class="col-12 md:col-4">
            <label>Data de Emissão *</label>
            <Calendar v-model="form.invoice_date" dateFormat="yy-mm-dd" class="w-full" :showIcon="true" required />
          </div>
          <div class="col-12 md:col-4">
            <label>Data de Recebimento</label>
            <Calendar v-model="form.received_date" dateFormat="yy-mm-dd" class="w-full" :showIcon="true" />
          </div>
          <div class="col-12 md:col-4">
            <label>Fornecedor</label>
            <InputText v-model="form.supplier_name" class="w-full" />
          </div>
          <div class="col-12 md:col-4">
            <label>CNPJ/CPF do Fornecedor</label>
            <InputText v-model="form.supplier_document" class="w-full" />
          </div>
          <div class="col-12 md:col-6">
            <label>Pedido de Compra (Opcional)</label>
            <div class="p-inputgroup">
              <InputNumber v-model="form.purchase_order_id" class="w-full" :useGrouping="false" placeholder="ID do pedido" />
              <Button
                icon="pi pi-search"
                class="p-button-outlined"
                @click="buscarPedido"
                :disabled="!form.purchase_order_id"
                :loading="carregandoPedido"
              />
            </div>
            <small class="text-500">Informe o ID do pedido para pré-preencher os itens</small>
          </div>
          <div class="col-12 md:col-6">
            <label>Cotacao (Opcional)</label>
            <InputNumber v-model="form.purchase_quote_id" class="w-full" :useGrouping="false" />
            <small class="text-500">ID da cotação relacionada</small>
          </div>
          <div class="col-12">
            <label>Observações</label>
            <Textarea v-model="form.observation" class="w-full" rows="2" />
          </div>
        </div>
      </div>

      <!-- Itens da Nota Fiscal -->
      <div class="card mb-4">
        <div class="flex justify-content-between align-items-center mb-3">
          <h6 class="text-900 m-0">Itens da Nota Fiscal</h6>
          <Button label="Adicionar Item" icon="pi pi-plus" class="p-button-sm" @click="adicionarItem" />
        </div>

        <DataTable :value="form.items" class="p-datatable-sm" :emptyMessage="'Nenhum item adicionado'">
          <Column header="Produto" style="min-width: 200px">
            <template #body="slotProps">
              <InputText
                v-model="slotProps.data.product_description"
                class="w-full"
                placeholder="Descrição do produto"
                @click="abrirModalBuscarProduto(slotProps.index)"
              />
            </template>
          </Column>
          <Column header="Código" style="min-width: 120px">
            <template #body="slotProps">
              <InputText v-model="slotProps.data.product_code" class="w-full" placeholder="Código" />
            </template>
          </Column>
          <Column header="Quantidade" style="min-width: 120px">
            <template #body="slotProps">
              <InputNumber
                v-model="slotProps.data.quantity"
                :min="0.0001"
                :step="0.0001"
                class="w-full"
                :useGrouping="false"
                @update:modelValue="calcularTotalItem(slotProps.index)"
              />
            </template>
          </Column>
          <Column header="Unidade" style="min-width: 100px">
            <template #body="slotProps">
              <InputText v-model="slotProps.data.unit" class="w-full" placeholder="UN" />
            </template>
          </Column>
          <Column header="Preço Unitário" style="min-width: 150px">
            <template #body="slotProps">
              <InputNumber
                v-model="slotProps.data.unit_price"
                mode="currency"
                currency="BRL"
                locale="pt-BR"
                :min="0"
                class="w-full"
                @update:modelValue="calcularTotalItem(slotProps.index)"
              />
            </template>
          </Column>
          <Column header="Preço Total" style="min-width: 150px">
            <template #body="slotProps">
              <InputNumber
                v-model="slotProps.data.total_price"
                mode="currency"
                currency="BRL"
                locale="pt-BR"
                :min="0"
                class="w-full"
                readonly
              />
            </template>
          </Column>
          <Column header="Local de Estoque *" style="min-width: 200px">
            <template #body="slotProps">
              <Dropdown
                v-model="slotProps.data.stock_location_id"
                :options="locais"
                optionLabel="name"
                optionValue="id"
                placeholder="Selecione o local"
                class="w-full"
                :filter="true"
                required
              />
            </template>
          </Column>
          <Column header="Ações" style="width: 80px">
            <template #body="slotProps">
              <Button
                icon="pi pi-trash"
                class="p-button-sm p-button-danger p-button-text"
                @click="removerItem(slotProps.index)"
              />
            </template>
          </Column>
        </DataTable>

        <div class="flex justify-content-end mt-3">
          <div class="text-xl font-semibold">
            Total da Nota: {{ formatarMoeda(totalNota) }}
          </div>
        </div>
      </div>

      <div class="flex justify-content-end mt-4 gap-2">
        <Button label="Cancelar" class="p-button-outlined" @click="$router.back()" />
        <Button label="Salvar e Dar Entrada no Estoque" type="submit" :loading="salvando" :disabled="form.items.length === 0" />
      </div>
    </form>

    <!-- Modal de Buscar Produto -->
    <Dialog v-model:visible="modalProduto.visivel" header="Buscar Produto" :modal="true" :style="{ width: '600px' }">
      <div class="mb-3">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText
            v-model="modalProduto.busca"
            placeholder="Buscar produto..."
            class="w-full"
            @input="buscarProdutos"
          />
        </span>
      </div>

      <DataTable
        :value="modalProduto.produtos"
        selectionMode="single"
        v-model:selection="modalProduto.produtoSelecionado"
        :loading="modalProduto.carregando"
        dataKey="id"
        class="p-datatable-sm"
        :emptyMessage="'Digite para buscar produtos'"
      >
        <Column selectionMode="single" headerStyle="width:3rem"></Column>
        <Column field="code" header="Código" />
        <Column field="description" header="Descrição" />
        <Column field="unit" header="Unidade" />
      </DataTable>

      <template #footer>
        <div class="flex justify-content-between align-items-center mt-3 w-full">
          <Button 
            label="Cadastrar Produto" 
            icon="pi pi-plus" 
            class="p-button-outlined p-button-success" 
            @click="abrirModalCadastroProduto" 
          />
          <div class="flex gap-2">
            <Button label="Cancelar" class="p-button-outlined" @click="modalProduto.visivel = false" />
            <Button
              label="Selecionar"
              class="p-button-success"
              @click="selecionarProduto"
              :disabled="!modalProduto.produtoSelecionado"
            />
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

    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import PurchaseInvoiceService from '@/service/PurchaseInvoiceService';
import StockProductService from '@/service/StockProductService';
import StockLocationService from '@/service/StockLocationService';

export default {
  name: 'NotaFiscalForm',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const invoiceService = new PurchaseInvoiceService();
    const productService = new StockProductService();
    const locationService = new StockLocationService();

    const form = ref({
      invoice_number: '',
      invoice_series: '',
      invoice_date: new Date(),
      received_date: null,
      purchase_quote_id: null,
      purchase_order_id: null,
      supplier_name: '',
      supplier_document: '',
      total_amount: 0,
      observation: '',
      items: [],
    });

    const locais = ref([]);
    const salvando = ref(false);
    const carregandoPedido = ref(false);
    const modalProduto = ref({
      visivel: false,
      busca: '',
      produtos: [],
      produtoSelecionado: null,
      carregando: false,
      itemIndex: null,
    });

    const modalCadastroProduto = ref({
      visivel: false,
      saving: false,
      form: {
        description: '',
        reference: '',
        unit: 'UN'
      }
    });

    let buscaTimeout = null;

    const totalNota = computed(() => {
      return form.value.items.reduce((total, item) => {
        return total + (parseFloat(item.total_price) || 0);
      }, 0);
    });

    const formatarMoeda = (valor) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(valor || 0);
    };

    const carregarLocais = async () => {
      try {
        const { data } = await locationService.getAll({ per_page: 100, active: true });
        locais.value = data.data || [];
      } catch (error) {
        console.error('Erro ao carregar locais:', error);
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar locais de estoque',
          life: 3000,
        });
      }
    };

    const adicionarItem = () => {
      form.value.items.push({
        product_code: '',
        product_description: '',
        quantity: 1,
        unit: 'UN',
        unit_price: 0,
        total_price: 0,
        stock_location_id: null,
        purchase_quote_item_id: null,
        observation: '',
      });
    };

    const removerItem = (index) => {
      form.value.items.splice(index, 1);
    };

    const calcularTotalItem = (index) => {
      const item = form.value.items[index];
      if (item && item.quantity && item.unit_price) {
        item.total_price = parseFloat(item.quantity) * parseFloat(item.unit_price);
      } else {
        item.total_price = 0;
      }
    };

    const abrirModalBuscarProduto = (index) => {
      modalProduto.value.itemIndex = index;
      modalProduto.value.visivel = true;
      modalProduto.value.busca = '';
      modalProduto.value.produtos = [];
      modalProduto.value.produtoSelecionado = null;
    };

    const buscarProdutos = () => {
      if (buscaTimeout) {
        clearTimeout(buscaTimeout);
      }

      buscaTimeout = setTimeout(async () => {
        if (!modalProduto.value.busca || modalProduto.value.busca.length < 2) {
          modalProduto.value.produtos = [];
          return;
        }

        try {
          modalProduto.value.carregando = true;
          const { data } = await productService.buscar({
            search: modalProduto.value.busca,
            per_page: 20,
          });

          modalProduto.value.produtos = data.data || [];
        } catch (error) {
          console.error('Erro ao buscar produtos:', error);
          toast.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Erro ao buscar produtos',
            life: 3000,
          });
        } finally {
          modalProduto.value.carregando = false;
        }
      }, 500);
    };

    const selecionarProduto = () => {
      if (!modalProduto.value.produtoSelecionado || modalProduto.value.itemIndex === null) {
        return;
      }

      const produto = modalProduto.value.produtoSelecionado;
      const item = form.value.items[modalProduto.value.itemIndex];

      item.product_code = produto.code || '';
      item.product_description = produto.description || '';
      item.unit = produto.unit || 'UN';

      modalProduto.value.visivel = false;
      modalProduto.value.produtoSelecionado = null;
    };

    const abrirModalCadastroProduto = () => {
      modalCadastroProduto.value.form = {
        description: modalProduto.value.busca || '',
        reference: '',
        unit: 'UN'
      };
      modalCadastroProduto.value.visivel = true;
    };

    const fecharModalCadastroProduto = () => {
      modalCadastroProduto.value.visivel = false;
      modalCadastroProduto.value.form = {
        description: '',
        reference: '',
        unit: 'UN'
      };
    };

    const validarFormProduto = () => {
      return modalCadastroProduto.value.form.description?.trim() && 
             modalCadastroProduto.value.form.unit?.trim();
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
        modalCadastroProduto.value.saving = true;

        // Cadastrar produto no sistema e no Protheus
        const response = await productService.saveWithProtheus(modalCadastroProduto.value.form);

        const produto = response.data?.data || response.data;

        // Fechar modal de cadastro
        fecharModalCadastroProduto();

        // Preencher o item da nota fiscal com o produto cadastrado
        if (modalProduto.value.itemIndex !== null) {
          const item = form.value.items[modalProduto.value.itemIndex];
          item.product_code = produto.code || '';
          item.product_description = produto.description || '';
          item.unit = produto.unit || 'UN';
        }

        // Atualizar lista de produtos para incluir o recém-cadastrado
        if (modalProduto.value.busca && modalProduto.value.busca.length >= 2) {
          // Se houver busca, atualizar a lista
          if (buscaTimeout) {
            clearTimeout(buscaTimeout);
          }
          buscaTimeout = setTimeout(async () => {
            try {
              modalProduto.value.carregando = true;
              const { data } = await productService.buscar({
                search: modalProduto.value.busca,
                per_page: 20,
              });
              modalProduto.value.produtos = data.data || [];
            } catch (error) {
              console.error('Erro ao buscar produtos:', error);
            } finally {
              modalProduto.value.carregando = false;
            }
          }, 100);
        }

        // Fechar modal de busca de produto
        modalProduto.value.visivel = false;
        modalProduto.value.produtoSelecionado = null;

        toast.add({
          severity: 'success',
          summary: 'Produto cadastrado e selecionado',
          detail: `Produto ${produto.code} cadastrado e adicionado ao item!`,
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
        modalCadastroProduto.value.saving = false;
      }
    };

    const buscarPedido = async () => {
      if (!form.value.purchase_order_id) {
        toast.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Informe o ID do pedido de compra',
          life: 3000,
        });
        return;
      }

      try {
        carregandoPedido.value = true;
        const { data } = await invoiceService.buscarPedido(form.value.purchase_order_id);
        const pedido = data.data;

        // Preencher dados da nota fiscal
        if (pedido.supplier_name) {
          form.value.supplier_name = pedido.supplier_name;
        }
        if (pedido.supplier_document) {
          form.value.supplier_document = pedido.supplier_document;
        }
        if (pedido.purchase_quote_id) {
          form.value.purchase_quote_id = pedido.purchase_quote_id;
        }

        // Limpar itens atuais e adicionar itens do pedido
        form.value.items = [];

        if (pedido.items && pedido.items.length > 0) {
          for (const orderItem of pedido.items) {
            const unitPrice = parseFloat(orderItem.unit_price) || parseFloat(orderItem.final_cost) || 0;
            const quantity = parseFloat(orderItem.quantity) || 1;
            const totalPrice = parseFloat(orderItem.total_price) || (quantity * unitPrice);
            
            // Calcular quantidade pendente (pedido - já recebido)
            const quantityReceived = parseFloat(orderItem.quantity_received || 0);
            const quantityPending = Math.max(0, quantity - quantityReceived);
            
            // Se já foi tudo recebido, não adicionar o item
            if (quantityPending <= 0) {
              continue;
            }
            
            form.value.items.push({
              product_code: orderItem.product_code || '',
              product_description: orderItem.product_description || '',
              quantity: quantityPending, // Quantidade pendente apenas
              unit: orderItem.unit || 'UN',
              unit_price: unitPrice,
              total_price: quantityPending * unitPrice,
              stock_location_id: null, // Usuário precisa selecionar
              purchase_quote_item_id: orderItem.purchase_quote_item_id || null,
              purchase_order_item_id: orderItem.id, // ID do item do pedido para vincular
              observation: orderItem.observation || '',
            });
          }

          toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `${pedido.items.length} item(ns) do pedido foram adicionados. Selecione o local de estoque para cada item.`,
            life: 4000,
          });
        } else {
          toast.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'Pedido não possui itens',
            life: 3000,
          });
        }
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || error.response?.data?.error || 'Erro ao buscar pedido',
          life: 3000,
        });
      } finally {
        carregandoPedido.value = false;
      }
    };

    const salvar = async () => {
      // Validações
      if (!form.value.invoice_number) {
        toast.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Número da nota fiscal é obrigatório',
          life: 3000,
        });
        return;
      }

      if (!form.value.invoice_date) {
        toast.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Data de emissão é obrigatória',
          life: 3000,
        });
        return;
      }

      if (form.value.items.length === 0) {
        toast.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'Adicione pelo menos um item à nota fiscal',
          life: 3000,
        });
        return;
      }

      // Validar itens
      for (let i = 0; i < form.value.items.length; i++) {
        const item = form.value.items[i];
        if (!item.product_description) {
          toast.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: `Item ${i + 1}: Descrição do produto é obrigatória`,
            life: 3000,
          });
          return;
        }
        if (!item.quantity || item.quantity <= 0) {
          toast.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: `Item ${i + 1}: Quantidade deve ser maior que zero`,
            life: 3000,
          });
          return;
        }
        if (!item.unit_price || item.unit_price <= 0) {
          toast.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: `Item ${i + 1}: Preço unitário deve ser maior que zero`,
            life: 3000,
          });
          return;
        }
        if (!item.stock_location_id) {
          toast.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: `Item ${i + 1}: Local de estoque é obrigatório`,
            life: 3000,
          });
          return;
        }
      }

      try {
        salvando.value = true;

        const dataToSend = {
          ...form.value,
          total_amount: totalNota.value,
          received_date: form.value.received_date || form.value.invoice_date,
        };

        await invoiceService.create(dataToSend);

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Nota fiscal criada e entrada no estoque realizada com sucesso!',
          life: 4000,
        });

        router.push('/estoque');
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || error.response?.data?.error || 'Erro ao criar nota fiscal',
          life: 3000,
        });
      } finally {
        salvando.value = false;
      }
    };

    const route = useRoute();

    onMounted(async () => {
      carregarLocais();
      
      // Verificar se há pedido_id na query string
      const pedidoId = route.query.pedido_id;
      if (pedidoId) {
        form.value.purchase_order_id = parseInt(pedidoId);
        await buscarPedido();
      } else {
        adicionarItem(); // Adicionar um item inicial apenas se não houver pedido
      }
    });

    return {
      form,
      locais,
      salvando,
      modalProduto,
      modalCadastroProduto,
      totalNota,
      formatarMoeda,
      adicionarItem,
      removerItem,
      calcularTotalItem,
      abrirModalBuscarProduto,
      buscarProdutos,
      selecionarProduto,
      buscarPedido,
      carregandoPedido,
      salvar,
      abrirModalCadastroProduto,
      fecharModalCadastroProduto,
      validarFormProduto,
      cadastrarProduto,
    };
  },
};
</script>

