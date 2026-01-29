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

    <!-- Tabela (paginação sempre envia page e per_page para o back) -->
    <DataTable
        :value="solicitacoes"
        :paginator="true"
        :rows="rows"
        :totalRecords="totalRecords"
        :lazy="true"
        dataKey="id"
        responsiveLayout="scroll"
        class="p-datatable-sm tabela-pendentes"
        :loading="carregando"
        @page="onPage"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} solicitações"
        :rowsPerPageOptions="[10, 20, 50, 100]"
    >
      <Column field="numero" header="Nº da Solicitação" sortable></Column>
      <Column field="data" header="Data" sortable></Column>
      <Column field="solicitante" header="Solicitante" sortable></Column>
      <Column field="centroCusto" header="Centro de Custo" sortable></Column>
      <Column field="frenteObra" header="Frente de Obra" sortable></Column>
      <Column field="status" header="Status">
        <template #body="slotProps">
          <Tag
            :value="slotProps.data.status"
            :severity="statusSeverity(slotProps.data.statusSlug)"
            :style="statusStyle(slotProps.data.statusSlug)"
          />
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
import { ref, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { ToastSeverity } from 'primevue/api';
import { useRouter } from 'vue-router';
import SolicitacaoService from '@/service/SolicitacaoService';

export default {
  name: 'SolicitacoesPendentes',
  setup() {
    const toast = useToast();
    const router = useRouter();

    const solicitacoes = ref([]);
    const filtroGlobal = ref('');
    const carregando = ref(false);
    const totalRecords = ref(0);
    const page = ref(1);
    const rows = ref(5);

    const carregar = async () => {
      try {
        carregando.value = true;
        const params = {
          page: page.value,
          per_page: rows.value,
          status_in: 'aguardando,autorizado',
        };
        if (filtroGlobal.value?.trim()) {
          params.search = filtroGlobal.value.trim();
        }
        const { data } = await SolicitacaoService.list(params);

        const list = data?.data || [];
        const pagination = data?.pagination || {};

        solicitacoes.value = list.map((item) => ({
          id: Number(item.id),
          numero: item.numero,
          data: item.data,
          solicitante: item.solicitante,
          centroCusto: item.centro_custo,
          frenteObra: item.frente_obra,
          status: item.status?.label || '-',
          statusSlug: item.status?.slug,
        }));

        totalRecords.value = pagination.total ?? list.length;
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível carregar as solicitações.';
        toast.add({ severity: 'error', summary: 'Erro ao carregar', detail, life: 4000 });
      } finally {
        carregando.value = false;
      }
    };

    const onPage = (event) => {
      page.value = event.page + 1;
      rows.value = event.rows;
      carregar();
    };

    onMounted(() => {
      page.value = 1;
      carregar();
    });

    watch(filtroGlobal, () => {
      page.value = 1;
      carregar();
    });

    const exportar = () => {
      toast.add({
        severity: ToastSeverity.INFO,
        summary: 'Exportar',
        detail: 'Exportação simulada com sucesso!',
        life: 2000,
      });
    };

    const visualizar = (item) => {
      toast.add({ severity: ToastSeverity.INFO, summary: 'Visualizar', detail: `Abrindo detalhes de ${item.numero}`, life: 2000 });

      if (['aguardando', 'analisada', 'analisada_aguardando', 'analise_gerencia'].includes(item.statusSlug)) {
        router.push({ name: 'aprovarSolicitacao', params: { id: String(item.id) } });
        return;
      }

      if (item.statusSlug === 'autorizado') {
        router.push({ name: 'vincularSolicitacao', params: { id: String(item.id) } });
        return;
      }

      router.push({ name: 'solicitacoesView', params: { id: String(item.id) } });
    };

    const statusSeverity = (slug) => {
      if (slug === 'aguardando') return 'warning';
      if (slug === 'autorizado') return 'info';
      if (slug === 'cotacao') return 'warning';
      if (slug === 'compra_em_andamento') return 'info';
      if (slug === 'finalizada') return 'info';
      if (slug === 'analisada') return 'help';
      if (slug === 'analisada_aguardando') return 'help';
      if (slug === 'analise_gerencia') return 'info';
      if (slug === 'aprovado') return 'success';
      return 'secondary';
    };

    const statusStyle = (slug) => {
      const styles = {
        aguardando: { backgroundColor: '#FFEED0', color: '#C47F17' }, // laranja
        autorizado: { backgroundColor: '#CDE7FF', color: '#1363B4' }, // azul claro
        cotacao: { backgroundColor: '#FFEED0', color: '#C47F17' }, // laranja
        compra_em_andamento: { backgroundColor: '#CDE7FF', color: '#1363B4' }, // azul
        finalizada: { backgroundColor: '#E0D5FF', color: '#5E37B4' }, // roxo
        analisada: { backgroundColor: '#BFF3E0', color: '#0F8558' }, // verde
        analisada_aguardando: { backgroundColor: '#F3F0C7', color: '#9C8A1F' }, // amarelo
        analise_gerencia: { backgroundColor: '#FAD7DF', color: '#B61643' }, // rosa/vermelho
        aprovado: { backgroundColor: '#CFF5D8', color: '#237A3F' }, // verde
      };

      return styles[slug] ?? { backgroundColor: '#E7E9EE', color: '#475569' };
    };

    return {
      solicitacoes,
      filtroGlobal,
      totalRecords,
      rows,
      onPage,
      exportar,
      visualizar,
      carregando,
      statusSeverity,
      statusStyle,
    };
  },
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
