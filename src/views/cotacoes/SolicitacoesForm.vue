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
        <InputText v-model="form.numero" class="w-full" disabled />
      </div>

      <div class="col-12 md:col-3">
        <label class="block text-600 mb-2">Data da Solicitação</label>
        <Calendar v-model="form.data" dateFormat="dd/mm/yy" class="w-full" />
      </div>

      <div class="col-12 md:col-3">
        <label class="block text-600 mb-2">Solicitante</label>
        <Dropdown v-model="form.solicitante" :options="solicitantes" optionLabel="label" placeholder="Selecione" class="w-full" />
      </div>

      <div class="col-12 md:col-3">
        <label class="block text-600 mb-2">Empresa</label>
        <Dropdown v-model="form.empresa" :options="empresas" optionLabel="label" placeholder="Selecione" class="w-full" />
      </div>

      <div class="col-12 md:col-6">
        <label class="block text-600 mb-2">Local</label>
        <InputText v-model="form.local" class="w-full" />
      </div>
    </div>

    <!-- Itens -->
    <div class="mt-4">
      <div class="flex justify-content-between align-items-center mb-2">
        <Button label="+ Item" icon="pi pi-plus" class="p-button-text p-button-success" @click="abrirModal" />
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
          <template #body="{ data }">
            <InputText v-model="data.centroCusto" class="w-full p-inputtext-sm" />
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
      <Button label="Salvar" icon="pi pi-check" class="p-button-success" @click="salvar" />
    </div>

    <!-- Modal de seleção de produto -->
    <Dialog v-model:visible="modalVisivel" modal header="Selecione o produto" style="width: 45vw">
      <div class="mb-3">
                <span class="p-input-icon-left w-full">
                    <i class="pi pi-search" />
                    <InputText v-model="filtroProduto" placeholder="Buscar" class="w-full" />
                </span>
      </div>

      <DataTable
          :value="produtosFiltrados"
          selectionMode="single"
          v-model:selection="produtoSelecionado"
          paginator
          :rows="5"
          responsiveLayout="scroll"
      >
        <Column field="codigo" header="Código" sortable />
        <Column field="descricao" header="Descrição" sortable />
        <Column field="unidade" header="Unidade de medida" sortable />
      </DataTable>

      <template #footer>
        <div class="flex justify-content-end mt-3">
          <Button label="Selecionar" class="p-button-success" @click="adicionarProduto" :disabled="!produtoSelecionado" />
        </div>
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

export default {
  name: 'CadastroSolicitacao',
  setup() {
    const router = useRouter();
    const toast = useToast();

    const form = ref({
      numero: 'SOL-0001',
      data: new Date('2025-08-28'),
      solicitante: null,
      empresa: null,
      local: '',
      observacao: '',
      itens: []
    });

    const solicitantes = ref([{ label: 'Rayanne Laureen' }, { label: 'João Souza' }]);
    const empresas = ref([{ label: 'Empresa A' }, { label: 'Empresa B' }]);

    const modalVisivel = ref(false);
    const filtroProduto = ref('');
    const produtoSelecionado = ref(null);

    const produtos = ref([
      { codigo: 'SOL-9281', descricao: 'Cadeira Escritório', unidade: 'UN' },
      { codigo: 'SOL-9283', descricao: 'Impressora Multifuncional', unidade: 'UN' },
      { codigo: 'SOL-9284', descricao: 'Monitor LED 24” LG', unidade: 'UN' }
    ]);

    const produtosFiltrados = computed(() => {
      if (!filtroProduto.value) return produtos.value;
      return produtos.value.filter(p =>
          p.descricao.toLowerCase().includes(filtroProduto.value.toLowerCase()) ||
          p.codigo.toLowerCase().includes(filtroProduto.value.toLowerCase())
      );
    });

    const abrirModal = () => (modalVisivel.value = true);

    const adicionarProduto = () => {
      const p = produtoSelecionado.value;
      if (!p) return;
      form.value.itens.push({
        codigo: p.codigo,
        referencia: 'NBK-2025',
        mercadoria: p.descricao,
        quantidade: 6,
        unidade: p.unidade,
        aplicacao: 'Substituição e melhoria',
        prioridade: 7,
        tag: 'TAG-101',
        centroCusto: '3.1.22'
      });
      toast.add({ severity: 'success', summary: 'Item adicionado', detail: p.descricao, life: 2000 });
      modalVisivel.value = false;
      produtoSelecionado.value = null;
    };

    const removerItem = index => {
      form.value.itens.splice(index, 1);
      toast.add({ severity: 'warn', summary: 'Item removido', life: 1500 });
    };

    const voltar = () => router.push('/solicitacoes');
    const salvar = () =>
        toast.add({
          severity: 'success',
          summary: 'Solicitação salva!',
          detail: `Número ${form.value.numero} registrada com sucesso.`,
          life: 3000
        });

    return {
      form,
      solicitantes,
      empresas,
      modalVisivel,
      filtroProduto,
      produtosFiltrados,
      produtoSelecionado,
      abrirModal,
      adicionarProduto,
      removerItem,
      voltar,
      salvar
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
:deep(.p-button-text.p-button-success) {
  color: #28a745 !important;
  background: none !important;
  border: 1px solid #28a745 !important;
  font-weight: 500;
}
</style>
