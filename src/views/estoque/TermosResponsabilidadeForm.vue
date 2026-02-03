<template>
  <div class="card p-5 bg-page">
    <div class="flex align-items-center gap-2 mb-4">
      <Button icon="pi pi-arrow-left" class="p-button-text" @click="voltar" />
      <h5 class="text-900 m-0">Novo Termo de Responsabilidade (Ferramentas)</h5>
    </div>

    <Message v-if="!empresaSelecionada" severity="warn" :closable="false" class="mb-4">
      Selecione uma <strong>empresa</strong> no menu superior (canto da tela) para carregar os locais de estoque e os produtos.
    </Message>
    <Message v-else-if="locais.length === 0 && !carregandoLocais" severity="info" :closable="false" class="mb-4">
      Nenhum local de estoque encontrado para a empresa selecionada, ou você não tem permissão. Verifique se possui permissão de <strong>Estoque > Locais</strong> ou <strong>Movimentações</strong>. <Button label="Carregar novamente" class="p-button-sm p-button-outlined ml-2" @click="carregarLocais" />
    </Message>

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

      <!-- Lista paginada de produtos do local selecionado -->
      <div v-if="form.stock_location_id" class="mb-4">
        <div class="flex flex-wrap align-items-center gap-2 mb-2">
          <span class="p-input-icon-left flex-grow-1" style="max-width: 280px">
            <i class="pi pi-search" />
            <InputText
              v-model="filtroProduto"
              placeholder="Filtrar por código ou descrição..."
              class="w-full"
              @keyup.enter="carregarProdutosEstoque(1)"
            />
          </span>
          <Button label="Buscar" icon="pi pi-search" class="p-button-outlined" @click="carregarProdutosEstoque(1)" />
        </div>
        <DataTable
          :value="listaProdutosEstoque"
          :loading="loadingProdutos"
          :lazy="true"
          :paginator="true"
          :rows="rowsProdutos"
          :totalRecords="totalProdutos"
          :rowsPerPageOptions="[10, 20, 50]"
          dataKey="id"
          class="p-datatable-sm"
          responsiveLayout="scroll"
          @page="onPageProdutos"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} produtos"
        >
          <Column field="code" header="Código" sortable style="min-width: 100px" />
          <Column field="description" header="Descrição" sortable style="min-width: 180px">
            <template #body="slotProps">
              <span class="text-wrap">{{ slotProps.data.description || '-' }}</span>
            </template>
          </Column>
          <Column field="unit" header="Un." style="width: 70px" />
          <Column header="Qtd disponível" style="width: 120px">
            <template #body="slotProps">
              {{ qtdDisponivel(slotProps.data) }}
            </template>
          </Column>
          <Column header="" style="width: 100px">
            <template #body="slotProps">
              <Button
                label="Adicionar"
                icon="pi pi-plus"
                class="p-button-sm p-button-outlined"
                :disabled="jaAdicionado(slotProps.data)"
                @click="adicionarProdutoDaLista(slotProps.data)"
              />
            </template>
          </Column>
          <template #empty>
            <div class="text-center text-600 py-3">
              {{ loadingProdutos ? 'Carregando...' : 'Nenhum produto com estoque neste local. Use o filtro para buscar.' }}
            </div>
          </template>
        </DataTable>
      </div>
      <p v-else class="text-600 text-sm mb-2">Selecione o local de estoque acima para listar os produtos disponíveis.</p>

      <label class="block mt-3 mb-2 text-600 text-sm">Itens adicionados</label>
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
          <div class="text-center text-600 py-3">Nenhum item. Selecione o local e adicione produtos da lista acima.</div>
        </template>
      </DataTable>
    </div>

    <div class="flex justify-content-end gap-2 mt-4">
      <Button label="Cancelar" class="p-button-text" @click="voltar" />
      <Button label="Gerar Termo (saída do estoque)" icon="pi pi-check" class="p-button-success" :loading="salvando" :disabled="!podeSalvar" @click="salvar" />
    </div>

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
import Toast from 'primevue/toast';
import Message from 'primevue/message';
import { useStore } from 'vuex';
import ResponsibilityTermService from '@/service/ResponsibilityTermService';
import StockLocationService from '@/service/StockLocationService';
import StockProductService from '@/service/StockProductService';

const router = useRouter();
const toast = useToast();
const store = useStore();

const empresaSelecionada = computed(() => store.getters?.isCompany != null);

const salvando = ref(false);
const carregandoLocais = ref(false);
const locais = ref([]);

const form = reactive({
  responsible_name: '',
  cpf: '',
  project: '',
  stock_location_id: null,
  observation: '',
  items: [],
});

let tempIdCounter = 0;

const listaProdutosEstoque = ref([]);
const totalProdutos = ref(0);
const loadingProdutos = ref(false);
const pageProdutos = ref(1);
const rowsProdutos = ref(10);
const filtroProduto = ref('');

const podeSalvar = computed(() => {
  return (
    (form.responsible_name || '').trim().length > 0 &&
    form.stock_location_id != null &&
    form.items.length > 0 &&
    form.items.every((i) => i.stock_product_id && Number(i.quantity) > 0)
  );
});

const voltar = () => router.push({ name: 'estoqueTermosResponsabilidade' });

const onLocationChange = () => {
  listaProdutosEstoque.value = [];
  totalProdutos.value = 0;
  pageProdutos.value = 1;
  filtroProduto.value = '';
  if (form.stock_location_id) carregarProdutosEstoque(1);
};

const carregarProdutosEstoque = async (page = 1) => {
  if (!form.stock_location_id) return;
  const companyId = getCompanyId();
  if (!companyId) {
    toast.add({ severity: 'warn', summary: 'Selecione a empresa', detail: 'Selecione uma empresa no menu superior.', life: 4000 });
    return;
  }
  loadingProdutos.value = true;
  try {
    const params = {
      per_page: rowsProdutos.value,
      page,
      location_id: form.stock_location_id,
    };
    if (filtroProduto.value?.trim()) params.search = filtroProduto.value.trim();
    const config = { headers: { 'company-id': String(companyId) } };
    const { data } = await StockProductService.buscar(params, config);
    const list = data?.data ?? data ?? [];
    listaProdutosEstoque.value = Array.isArray(list) ? list : [];
    const pag = data?.pagination ?? {};
    totalProdutos.value = pag.total ?? listaProdutosEstoque.value.length;
  } catch (e) {
    listaProdutosEstoque.value = [];
    totalProdutos.value = 0;
    const msg = e?.response?.data?.message || 'Erro ao carregar produtos do estoque.';
    toast.add({ severity: 'error', summary: 'Erro', detail: msg, life: 4000 });
  } finally {
    loadingProdutos.value = false;
  }
};

const onPageProdutos = (event) => {
  pageProdutos.value = event.page + 1;
  rowsProdutos.value = event.rows;
  carregarProdutosEstoque(pageProdutos.value);
};

const qtdDisponivel = (product) => {
  const locs = product?.locations ?? [];
  const loc = locs.find((l) => Number(l.location_id) === Number(form.stock_location_id));
  return loc != null ? Number(loc.quantity_available ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 4 }) : '-';
};

const jaAdicionado = (product) => form.items.some((i) => i.stock_product_id === product.id);

const adicionarProdutoDaLista = (p) => {
  if (!p) return;
  if (jaAdicionado(p)) {
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

const getCompanyId = () => {
  const c = store.getters?.isCompany;
  if (c?.id != null) return c.id;
  const list = store.getters?.companies;
  if (Array.isArray(list) && list.length > 0 && list[0]?.id != null) return list[0].id;
  return null;
};

const carregarLocais = async () => {
  let companyId = getCompanyId();
  if (!companyId) {
    const list = store.getters?.companies;
    if (Array.isArray(list) && list.length === 1 && list[0]?.id != null) {
      store.commit('setCompany', list[0]);
      companyId = list[0].id;
    } else {
      locais.value = [];
      return;
    }
  }
  carregandoLocais.value = true;
  locais.value = [];
  try {
    const axios = (await import('@/plugins/axios')).default;
    const headers = { 'company-id': String(companyId) };
    let res = null;
    try {
      res = await axios.get('/estoque/locais/all-active', { params: { per_page: 100 }, headers });
    } catch (e1) {
      try {
        res = await axios.get('/estoque/locais', { params: { per_page: 100, active: true }, headers });
      } catch (e2) {
        throw e1?.response?.data?.message ? { ...e1, message: e1.response.data.message } : e1;
      }
    }
    const data = res?.data;
    const list = data?.data ?? (Array.isArray(data) ? data : []) ?? [];
    locais.value = Array.isArray(list) ? list : [];
  } catch (e) {
    locais.value = [];
    const msg = e?.response?.data?.message || e?.message || 'Erro ao carregar locais.';
    toast.add({
      severity: 'error',
      summary: 'Erro ao carregar locais',
      detail: msg,
      life: 6000,
    });
  } finally {
    carregandoLocais.value = false;
  }
};

onMounted(() => {
  carregarLocais();
});
</script>
