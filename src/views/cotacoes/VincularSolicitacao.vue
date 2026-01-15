<template>
  <div class="card p-5 bg-page">
    <!-- Cabeçalho -->
    <div class="flex align-items-center mb-4">
      <Button icon="pi pi-arrow-left" class="p-button-text mr-2" @click="voltar" />
      <h4 class="m-0 text-900">Vincular solicitação</h4>
    </div>

    <!-- Bloco de Vinculação -->
    <div class="card shadow-none bg-light p-4 mb-4">
      <h5 class="mb-3 text-900">Vincule o comprador</h5>

      <div class="grid">
        <div class="col-12 md:col-4">
          <label class="block text-600 mb-2">Comprador</label>
          <Dropdown
              v-model="compradorSelecionado"
              :options="compradores"
              optionLabel="label"
              placeholder="Comprador"
              class="w-full"
          />
        </div>
      </div>
    </div>

    <!-- Bloco Identificação da Solicitação -->
    <div class="card shadow-none bg-light p-4 mb-4">
      <h5 class="mb-3 text-900">Identificação da Solicitação</h5>

      <div class="grid text-sm">
        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Número da solicitação</label>
          <p class="text-900 font-semibold">{{ solicitacao.numero }}</p>
        </div>

        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Data da Solicitação</label>
          <p class="text-900 font-semibold">{{ solicitacao.data }}</p>
        </div>

        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Empresa</label>
          <p class="text-900 font-semibold">{{ solicitacao.empresa }}</p>
        </div>

        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Local</label>
          <p class="text-900 font-semibold">{{ solicitacao.local }}</p>
        </div>

        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Solicitante</label>
          <p class="text-900 font-semibold">{{ solicitacao.solicitante }}</p>
        </div>
      </div>

      <!-- Tabela de Itens -->
      <DataTable
          :value="solicitacao.itens"
          class="p-datatable-sm tabela-vincular mt-4"
          responsiveLayout="scroll"
      >
        <Column field="codigo" header="Código" />
        <Column field="referencia" header="Referência" />
        <Column field="mercadoria" header="Mercadoria" />
        <Column field="quantidade" header="Quant solicitada" />
        <Column field="unidade" header="Medida" />
        <Column field="aplicacao" header="Aplicação" />
        <Column field="prioridade" header="Prioridade dias" />
        <Column field="tag" header="TAG" />
        <Column field="centroCusto" header="Centro de custo" />
      </DataTable>

      <!-- Observação -->
      <div class="mt-4">
        <label class="block text-600 mb-1">Observação</label>
        <p class="text-900">{{ solicitacao.observacao }}</p>
      </div>
    </div>

    <!-- Botão de ação -->
    <div class="flex justify-content-end mt-4">
      <Button
          label="Vincular"
          icon="pi pi-link"
          class="p-button-success"
          @click="vincular"
      />
    </div>

    <Toast />
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

export default {
  name: 'VincularSolicitacao',
  setup() {
    const router = useRouter();
    const toast = useToast();

    // Mock da solicitação
    const solicitacao = ref({
      numero: 'SOL-0001',
      data: '28/08/2025',
      empresa: 'TechParts Distribuidora LTDA',
      local: 'Laboratório de TI – Bloco A',
      solicitante: 'Rayanne Laureen',
      observacao: 'Solicitação urgente devido à falha em equipamentos.',
      itens: [
        {
          codigo: 'SOL-9281',
          referencia: 'NBK-2025',
          mercadoria: 'Cadeira escritório',
          quantidade: 6,
          unidade: 'UN',
          aplicacao: 'Substituição e melhoria',
          prioridade: 7,
          tag: 'TAG-101',
          centroCusto: '3.1.22'
        },
        {
          codigo: 'SOL-9281',
          referencia: 'NBK-2025',
          mercadoria: 'Memória',
          quantidade: 3,
          unidade: 'UN',
          aplicacao: 'Substituição e melhoria',
          prioridade: 7,
          tag: 'TAG-101',
          centroCusto: '3.1.22'
        },
        {
          codigo: 'SOL-9281',
          referencia: 'NBK-2025',
          mercadoria: 'HD',
          quantidade: 2,
          unidade: 'UN',
          aplicacao: 'Substituição e melhoria',
          prioridade: 7,
          tag: 'TAG-101',
          centroCusto: '3.1.22'
        }
      ]
    });

    // Mock dos compradores
    const compradores = ref([
      { label: 'João Pereira', value: 1 },
      { label: 'Mariana Silva', value: 2 },
      { label: 'Rafael Costa', value: 3 },
      { label: 'Larissa Gomes', value: 4 }
    ]);

    const compradorSelecionado = ref(null);

    const vincular = () => {
      if (!compradorSelecionado.value) {
        toast.add({
          severity: 'warn',
          summary: 'Seleção obrigatória',
          detail: 'Escolha um comprador antes de vincular.',
          life: 3000
        });
        return;
      }

      toast.add({
        severity: 'success',
        summary: 'Solicitação vinculada',
        detail: `Solicitação ${solicitacao.value.numero} vinculada a ${compradorSelecionado.value.label}.`,
        life: 3000
      });
    };

    const voltar = () => router.push('/solicitacoes/pendentes');

    return {
      solicitacao,
      compradores,
      compradorSelecionado,
      vincular,
      voltar
    };
  }
};
</script>

<style scoped>
.bg-page {
  background-color: #f6f9fb;
}
.bg-light {
  background-color: #fff;
  border-radius: 10px;
}

/* Estilo da tabela igual ao print */
.tabela-vincular :deep(.p-datatable-thead > tr > th) {
  background-color: #f5fcf6;
  color: #333;
  font-weight: 500;
  border: 1px solid #eaeaea;
}
.tabela-vincular :deep(.p-datatable-tbody > tr > td) {
  background-color: #fbfefb;
  border: 1px solid #f0f0f0;
  color: #444;
}
.tabela-vincular :deep(.p-datatable-tbody > tr:hover > td) {
  background-color: #f3faf3;
}

/* Ajuste dos botões */
:deep(.p-button-success) {
  font-weight: 500;
  padding: 0.6rem 1.5rem;
}

/* Tipografia */
.text-600 {
  color: #6b7280;
}
.text-900 {
  color: #111827;
}
</style>
