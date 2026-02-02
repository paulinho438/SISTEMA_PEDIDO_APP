<template>
  <div class="card p-5 bg-page">
    <div class="flex align-items-center gap-2 mb-4">
      <Button icon="pi pi-arrow-left" class="p-button-text" @click="voltar" />
      <h5 class="text-900 m-0">Novo Termo de Responsabilidade (Ferramentas)</h5>
    </div>
    <p class="text-600 mt-0 mb-4">
      Informe o responsável e os itens (ferramentas/equipamentos) que sairão do estoque. Ao devolver, os itens retornarão ao estoque.
    </p>

    <div class="grid">
      <div class="col-12 md:col-6">
        <label for="responsible_name">Nome do Responsável *</label>
        <InputText id="responsible_name" v-model="form.responsible_name" class="w-full" placeholder="Nome completo" />
      </div>
      <div class="col-12 md:col-3">
        <label for="cpf">CPF</label>
        <InputText id="cpf" v-model="form.cpf" class="w-full" placeholder="Opcional" />
      </div>
      <div class="col-12 md:col-3">
        <label for="project">Obra/Projeto</label>
        <InputText id="project" v-model="form.project" class="w-full" placeholder="Ex.: Obra XYZ" />
      </div>
      <div class="col-12 md:col-6">
        <label for="location">Local de Estoque (retirada) *</label>
        <Dropdown
          id="location"
          v-model="form.stock_location_id"
          :options="locais"
          optionLabel="name"
          optionValue="id"
          placeholder="Selecione o local"
          class="w-full"
          :filter="true"
          @change="onLocationChange"
        />
      </div>
      <div class="col-12">
        <label>Observação</label>
        <InputText v-model="form.observation" class="w-full" placeholder="Opcional" />
      </div>
    </div>

    <div class="mt-4">
      <label>Itens (ferramentas/equipamentos) *</label>
      <div class="flex gap-2 mb-2">
        <span class="p-input-icon-left flex-grow-1">
          <i class="pi pi-search" />
          <InputText
            v-model="buscaProduto"
            placeholder="Buscar produto por código ou descrição..."
            class="w-full"
            @keyup.enter="adicionarProdutoBusca"
          />
        </span>
        <Button label="Adicionar" icon="pi pi-plus" class="p-button-outlined" @click="adicionarProdutoBusca" />
      </div>

      <DataTable :value="form.items" dataKey="tempId" class="p-datatable-sm" responsiveLayout="scroll">
        <Column header="Produto" field="description">
          <template #body="slotProps">
            {{ slotProps.data.code }} - {{ slotProps.data.description }}
          </template>
        </Column>
        <Column header="Quantidade" style="width: 140px">
          <template #body="slotProps">
            <InputNumber
              v-model="slotProps.data.quantity"
              :min-fraction-digits="0"
              :max-fraction-digits="4"
              :min="0.0001"
              class="w-full"
              inputClass="text-right"
            />
          </template>
        </Column>
        <Column header="" style="width: 80px">
          <template #body="slotProps">
            <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger p-button-sm" @click="removerItem(slotProps.data)" />
          </template>
        </Column>
        <template #empty>
          <div class="text-center text-600 py-3">Nenhum item. Busque e adicione produtos acima.</div>
        </template>
      </DataTable>
    </div>

    <div class="flex justify-content-end gap-2 mt-4">
      <Button label="Cancelar" class="p-button-text" @click="voltar" />
      <Button label="Gerar Termo (saída do estoque)" icon="pi pi-check" class="p-button-success" :loading="salvando" :disabled="!podeSalvar" @click="salvar" />
    </div>

    <Dialog
      v-model:visible="modalProduto.visible"
      header="Selecionar produto"
      :style="{ width: '500px' }"
      modal
      :closable="true"
    >
      <div class="mb-2">
        <InputText v-model="modalProduto.busca" placeholder="Código ou descrição" class="w-full" @keyup.enter="buscarProdutos" />
      </div>
      <DataTable
        :value="modalProduto.lista"
        :loading="modalProduto.loading"
        selectionMode="single"
        v-model:selection="modalProduto.selecionado"
        dataKey="id"
        class="p-datatable-sm"
        @row-select="onProdutoSelecionado"
      >
        <Column field="code" header="Código" />
        <Column field="description" header="Descrição" />
        <Column field="unit" header="Un." />
      </DataTable>
      <template #footer>
        <Button label="Fechar" class="p-button-text" @click="modalProduto.visible = false" />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';
import ResponsibilityTermService from '@/service/ResponsibilityTermService';
import StockLocationService from '@/service/StockLocationService';
import StockProductService from '@/service/StockProductService';

const router = useRouter();
const toast = useToast();

const salvando = ref(false);
const locais = ref([]);
const buscaProduto = ref('');

const form = reactive({
  responsible_name: '',
  cpf: '',
  project: '',
  stock_location_id: null,
  observation: '',
  items: [],
});

let tempIdCounter = 0;
const modalProduto = reactive({
  visible: false,
  busca: '',
  lista: [],
  loading: false,
  selecionado: null,
});

const podeSalvar = computed(() => {
  return (
    (form.responsible_name || '').trim().length > 0 &&
    form.stock_location_id != null &&
    form.items.length > 0 &&
    form.items.every((i) => i.stock_product_id && Number(i.quantity) > 0)
  );
});

const voltar = () => router.push({ name: 'estoqueTermosResponsabilidade' });
const onLocationChange = () => {};

const adicionarProdutoBusca = () => {
  if (!buscaProduto.value?.trim()) {
    modalProduto.visible = true;
    modalProduto.busca = '';
    buscarProdutos();
    return;
  }
  modalProduto.visible = true;
  modalProduto.busca = buscaProduto.value.trim();
  buscarProdutos();
};

const buscarProdutos = async () => {
  if (!form.stock_location_id) {
    toast.add({ severity: 'warn', summary: 'Selecione o local', detail: 'Escolha o local de estoque antes de adicionar itens.', life: 3000 });
    return;
  }
  modalProduto.loading = true;
  try {
    const params = { per_page: 20, location_id: form.stock_location_id };
    if (modalProduto.busca?.trim()) params.search = modalProduto.busca.trim();
    const { data } = await StockProductService.buscar(params);
    const list = data?.data ?? data ?? [];
    modalProduto.lista = Array.isArray(list) ? list : [];
  } catch (e) {
    modalProduto.lista = [];
  } finally {
    modalProduto.loading = false;
  }
};

const onProdutoSelecionado = (event) => {
  const p = event.data;
  if (!p) return;
  const jaAdicionado = form.items.some((i) => i.stock_product_id === p.id);
  if (jaAdicionado) {
    toast.add({ severity: 'warn', summary: 'Item já adicionado', detail: 'Este produto já está na lista.', life: 3000 });
    return;
  }
  form.items.push({
    tempId: ++tempIdCounter,
    stock_product_id: p.id,
    code: p.code,
    description: p.description ?? p.code,
    quantity: 1,
  });
  modalProduto.visible = false;
  modalProduto.selecionado = null;
};

const removerItem = (row) => {
  const idx = form.items.findIndex((i) => i.tempId === row.tempId);
  if (idx !== -1) form.items.splice(idx, 1);
};

const salvar = async () => {
  if (!podeSalvar.value) return;
  salvando.value = true;
  try {
    const payload = {
      responsible_name: form.responsible_name.trim(),
      cpf: form.cpf?.trim() || undefined,
      project: form.project?.trim() || undefined,
      stock_location_id: form.stock_location_id,
      observation: form.observation?.trim() || undefined,
      items: form.items.map((i) => ({
        stock_product_id: i.stock_product_id,
        quantity: Number(i.quantity),
      })),
    };
    await ResponsibilityTermService.create(payload);
    toast.add({ severity: 'success', summary: 'Termo criado', detail: 'Itens deram saída do estoque. Gere o PDF na listagem.', life: 4000 });
    router.push({ name: 'estoqueTermosResponsabilidade' });
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro', detail: e?.response?.data?.message || 'Falha ao criar termo.', life: 5000 });
  } finally {
    salvando.value = false;
  }
};

onMounted(async () => {
  try {
    const res = await StockLocationService.getAllActive({ per_page: 100 });
    const data = res?.data;
    locais.value = data?.data ?? (Array.isArray(data) ? data : []) ?? [];
    if (!Array.isArray(locais.value)) locais.value = [];
  } catch (e) {
    locais.value = [];
    toast.add({
      severity: 'error',
      summary: 'Erro ao carregar locais',
      detail: e?.response?.data?.message || 'Verifique se a empresa está selecionada e se você tem permissão.',
      life: 5000,
    });
  }
});
</script>
