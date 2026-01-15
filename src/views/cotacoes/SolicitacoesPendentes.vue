<template>
  <div class="card p-4">
    <!-- Cabeçalho -->
    <div class="flex justify-content-between align-items-center mb-3">
      <div></div>
      <Button label="Exportar" icon="pi pi-upload" class="p-button-outlined" @click="exportar" />
    </div>

    <!-- Título -->
    <h5 class="text-900 mb-3">Listagem de Solicitações Pendentes de aprovação</h5>

    <!-- Campo de busca -->
    <div class="flex justify-content-end mb-3">
            <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText
                    v-model="filtroGlobal"
                    placeholder="Buscar..."
                    class="p-inputtext-sm"
                    style="width: 16rem"
                />
            </span>
    </div>

    <!-- Tabela -->
    <DataTable
        :value="filtrarSolicitacoes"
        :paginator="true"
        :rows="5"
        dataKey="id"
        responsiveLayout="scroll"
        class="p-datatable-sm tabela-pendentes"
    >
      <Column selectionMode="multiple" headerStyle="width:3rem"></Column>
      <Column field="numero" header="Nº da Solicitação" sortable></Column>
      <Column field="data" header="Data" sortable></Column>
      <Column field="solicitante" header="Solicitante" sortable></Column>
      <Column field="centroCusto" header="Centro de Custo" sortable></Column>
      <Column field="frenteObra" header="Frente de Obra" sortable></Column>
      <Column field="status" header="Status">
        <template #body="slotProps">
          <Tag value="Aguardando" severity="warning" />
        </template>
      </Column>
      <Column header="">
        <template #body="slotProps">
          <Button
              icon="pi pi-eye"
              class="p-button-rounded p-button-text p-button-info"
              @click="visualizar(slotProps.data)"
          />
        </template>
      </Column>
    </DataTable>

    <Toast />
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { ToastSeverity } from 'primevue/api';
import {useRouter} from "vue-router";

export default {
  name: 'SolicitacoesPendentes',
  setup() {
    const toast = useToast();

    const router = useRouter();

    // dados mockados
    const solicitacoes = ref([
      {
        id: 1,
        numero: 'SOL-1234',
        data: '01/10/2025',
        solicitante: 'Rayanne Laureen',
        centroCusto: 'CC-0002 - TI Corporativo',
        frenteObra: 'FO-001 - Prédio Administrativo',
        status: 'Aguardando'
      },
      {
        id: 2,
        numero: 'SOL-9281',
        data: '20/09/2025',
        solicitante: 'Maria Oliveira',
        centroCusto: 'TI Corporativo',
        frenteObra: 'Expansão Data Center',
        status: 'Aguardando'
      },
      {
        id: 3,
        numero: 'SOL-3476',
        data: '18/09/2025',
        solicitante: 'João Souzas',
        centroCusto: 'Marketing',
        frenteObra: 'Campanha Publicitária',
        status: 'Aprovado'
      }
    ]);

    const filtroGlobal = ref('');

    const filtrarSolicitacoes = computed(() => {
      if (!filtroGlobal.value) return solicitacoes.value;
      return solicitacoes.value.filter(s =>
          Object.values(s)
              .join(' ')
              .toLowerCase()
              .includes(filtroGlobal.value.toLowerCase())
      );
    });

    const exportar = () => {
      toast.add({
        severity: ToastSeverity.INFO,
        summary: 'Exportar',
        detail: 'Exportação simulada com sucesso!',
        life: 2000
      });
    };

    const visualizar = item => {
      toast.add({
        severity: ToastSeverity.INFO,
        summary: 'Visualizar',
        detail: `Abrindo detalhes de ${item.numero}`,
        life: 2000
      });

      if(item.status == 'Aprovado'){
        router.push({ name: 'vincularSolicitacao' });
      }else{
        router.push({ name: 'aprovarSolicitacao' });

      }


    };

    return {
      solicitacoes,
      filtroGlobal,
      filtrarSolicitacoes,
      exportar,
      visualizar
    };
  }
};
</script>

<style scoped>
.card {
  border-radius: 10px;
  background: #fff;
}

/* Estilo da tabela igual ao print */
.tabela-pendentes :deep(.p-datatable-thead > tr > th) {
  background-color: #f9fafb;
  color: #333;
  font-weight: 600;
  border: none;
  border-bottom: 1px solid #eaeaea;
}

.tabela-pendentes :deep(.p-datatable-tbody > tr > td) {
  border: none;
  border-bottom: 1px solid #f0f0f0;
  color: #444;
}

.tabela-pendentes :deep(.p-tag-warning) {
  background-color: #fff4e5 !important;
  color: #b76e00 !important;
  border-radius: 10px;
  font-weight: 500;
  padding: 0.3rem 1rem;
}

:deep(.p-button-info.p-button-text) {
  color: #1e90ff !important;
}

:deep(.p-paginator-bottom) {
  border-top: none !important;
  background: transparent !important;
}
</style>
