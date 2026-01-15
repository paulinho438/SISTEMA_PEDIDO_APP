<template>
  <div class="card p-5 bg-page">
    <!-- Cabeçalho -->
    <div class="flex align-items-center mb-4">
      <Button icon="pi pi-arrow-left" class="p-button-text mr-2" @click="voltar" />
      <h4 class="m-0 text-900">Aprovar solicitação</h4>
    </div>

    <!-- Bloco Identificação -->
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
          class="p-datatable-sm tabela-aprovar mt-4"
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

    <!-- Botões -->
    <div class="flex justify-content-end gap-2">
      <Button
          label="Reprovar"
          icon="pi pi-times"
          class="p-button-danger"
          @click="reprovar"
      />
      <Button
          label="Aprovar"
          icon="pi pi-check"
          class="p-button-success"
          @click="aprovar"
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
  name: 'AprovarSolicitacao',
  setup() {
    const router = useRouter();
    const toast = useToast();

    // Mock completo da solicitação
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

    const voltar = () => router.push('/solicitacoes/pendentes');
    const aprovar = () => {
      toast.add({
        severity: 'success',
        summary: 'Solicitação aprovada',
        detail: `${solicitacao.value.numero} aprovada com sucesso!`,
        life: 3000
      });
    };
    const reprovar = () => {
      toast.add({
        severity: 'error',
        summary: 'Solicitação reprovada',
        detail: `${solicitacao.value.numero} foi reprovada.`,
        life: 3000
      });
    };

    return { solicitacao, voltar, aprovar, reprovar };
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

.tabela-aprovar :deep(.p-datatable-thead > tr > th) {
  background-color: #f5fcf6;
  color: #333;
  font-weight: 500;
  border: 1px solid #eaeaea;
}
.tabela-aprovar :deep(.p-datatable-tbody > tr > td) {
  background-color: #fbfefb;
  border: 1px solid #f0f0f0;
  color: #444;
}
.tabela-aprovar :deep(.p-datatable-tbody > tr:hover > td) {
  background-color: #f3faf3;
}
</style>
