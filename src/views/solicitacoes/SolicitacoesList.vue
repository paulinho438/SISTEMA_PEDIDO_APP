<template>
  <Toast />
  <div class="card p-4">
    <!-- Cabeçalho e ações -->
    <div class="flex justify-content-between align-items-center mb-4">
      <div>
        <Button
            label="Nova Solicitação"
            icon="pi pi-plus"
            class="p-button-success mr-2"
            @click="novaSolicitacao"
        />
        <Button
            label="Deletar"
            icon="pi pi-trash"
            class="p-button-danger mr-2"
            :disabled="!selecionadas.length"
            @click="deletarSelecionadas"
        />
      </div>

      <div class="flex align-items-center">
        <Button
            label="Exportar"
            icon="pi pi-upload"
            class="p-button-outlined mr-3"
            @click="exportar"
        />
        <span class="p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText
                        v-model="filtroGlobal"
                        placeholder="Buscar..."
                        class="p-inputtext-sm"
                        style="width: 16rem"
                        @input="onSearchChange"
                    />
                </span>
      </div>
    </div>

    <!-- Tabela -->
    <DataTable
        :value="solicitacoes"
        :paginator="true"
        :rows="paginacao.perPage"
        :totalRecords="paginacao.total"
        :lazy="true"
        :first="(paginacao.page - 1) * paginacao.perPage"
        dataKey="id"
        responsiveLayout="scroll"
        v-model:selection="selecionadas"
        selectionMode="checkbox"
        :loading="carregando"
        @page="onPageChange"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[10, 20, 50, 100]"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} solicitações"
    >
      <Column selectionMode="multiple" headerStyle="width:3rem"></Column>
      <Column field="numero" header="Nº da Solicitação" sortable></Column>
      <Column field="data" header="Data" sortable></Column>
      <Column field="solicitante" header="Solicitante" sortable></Column>
      <Column header="Centro de Custo" sortable>
        <template #body="slotProps">
          {{ formatarCentroCusto(slotProps.data.centroCusto) }}
        </template>
      </Column>
      <Column field="frenteObra" header="Frente de Obra" sortable></Column>

      <Column header="Status" sortable>
        <template #body="slotProps">
          <Tag
              :value="slotProps.data.status"
              :severity="mapaStatus[slotProps.data.statusSlug] || 'secondary'"
              :style="statusStyle(slotProps.data.statusSlug)"
          />
        </template>
      </Column>

      <Column header="Ações" style="width: 12rem">
        <template #body="slotProps">
          <div class="flex justify-content-around">
            <Button
                icon="pi pi-eye"
                class="p-button-rounded p-button-text"
                @click="visualizar(slotProps.data)"
                v-tooltip.top="'Visualizar'"
            />
            <Button
                v-if="podeEditar(slotProps.data.statusSlug)"
                icon="pi pi-pencil"
                class="p-button-rounded p-button-text p-button-success"
                @click="editar(slotProps.data)"
                v-tooltip.top="'Editar solicitação'"
            />
            <Button
                v-if="podeAlterarQuantidade(slotProps.data.statusSlug)"
                icon="pi pi-sort-numeric-up"
                class="p-button-rounded p-button-text p-button-info"
                @click="alterarQuantidade(slotProps.data)"
                v-tooltip.top="'Alterar quantidade'"
            />
            <Button
                v-if="podeAlterarCentroCusto"
                icon="pi pi-wallet"
                class="p-button-rounded p-button-text p-button-warning"
                @click="alterarCentroCusto(slotProps.data)"
                v-tooltip.top="'Alterar centro de custo dos itens'"
            />
            <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-text p-button-danger"
                @click="excluir(slotProps.data)"
                v-tooltip.top="'Excluir'"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Modal de Confirmação de Exclusão -->
    <ConfirmDialog />

  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import { useRouter } from 'vue-router';
import SolicitacaoService from '@/service/SolicitacaoService';
import PermissionsService from '@/service/PermissionsService';

export default {
  name: 'CicomList',
  setup() {
    const toast = useToast();
    const confirm = useConfirm();
    const router = useRouter();
    const permissionService = new PermissionsService();

    const solicitacoes = ref([]);
    const filtroGlobal = ref('');
    const selecionadas = ref([]);
    const carregando = ref(false);
    const searchTimeout = ref(null);
    
    const paginacao = ref({
      page: 1,
      perPage: 10,
      total: 0,
      lastPage: 1
    });

    // Verificar se o usuário tem permissão para visualizar todas as solicitações
    const podeVerTodas = computed(() => {
      return permissionService.hasPermissions('view_all_solicitacoes');
    });

    // Permissão para alterar centro de custo (independente do status)
    const podeAlterarCentroCusto = computed(() => {
      return permissionService.hasPermissions('alterar_centro_custo_solicitacao');
    });

    const mapaStatus = {
      aguardando: 'warning',
      autorizado: 'info',
      cotacao: 'warning',
      compra_em_andamento: 'info',
      finalizada: 'info',
      analisada: 'help',
      analisada_aguardando: 'help',
      analise_gerencia: 'info',
      aprovado: 'success',
    };

    const carregarSolicitacoes = async () => {
      try {
        carregando.value = true;
        
        const params = {
          page: paginacao.value.page,
          per_page: paginacao.value.perPage
        };
        
        // Se não tiver permissão para ver todas, filtrar apenas as do usuário logado
        if (!podeVerTodas.value) {
          params.my_requests = 'true';
        }
        
        // Adicionar busca se houver filtro
        if (filtroGlobal.value && filtroGlobal.value.trim()) {
          params.search = filtroGlobal.value.trim();
        }
        
        const { data } = await SolicitacaoService.list(params);
        
        // Backend retorna: { data: [...], pagination: { current_page, per_page, total, last_page } }
        solicitacoes.value = (data?.data || []).map((item) => ({
          id: item.id,
          numero: item.numero,
          data: item.data,
          solicitante: item.solicitante,
          centroCusto: typeof item.centro_custo === 'string' ? item.centro_custo : item.centro_custo,
          frenteObra: item.frente_obra,
          status: item.status?.label,
          statusSlug: item.status?.slug,
        }));
        
        const pag = data?.pagination || {};
        paginacao.value.total = pag.total ?? data?.total ?? 0;
        paginacao.value.page = pag.current_page ?? data?.current_page ?? 1;
        paginacao.value.perPage = pag.per_page ?? data?.per_page ?? 10;
        paginacao.value.lastPage = pag.last_page ?? data?.last_page ?? 1;
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível carregar as solicitações.';
        toast.add({ severity: 'error', summary: 'Erro ao carregar', detail, life: 4000 });
      } finally {
        carregando.value = false;
      }
    };

    const onPageChange = (event) => {
      paginacao.value.page = event.page + 1; // PrimeVue usa índice 0, Laravel usa 1
      paginacao.value.perPage = event.rows;
      carregarSolicitacoes();
    };
    
    const onSearchChange = () => {
      // Debounce: aguardar 500ms após o usuário parar de digitar
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
      }
      
      searchTimeout.value = setTimeout(() => {
        paginacao.value.page = 1; // Resetar para primeira página ao buscar
        carregarSolicitacoes();
      }, 500);
    };

    onMounted(carregarSolicitacoes);

    const novaSolicitacao = () => router.push({ name: 'solicitacoesAdd' });
    const exportar = () => toast.add({ severity: 'info', summary: 'Exportar', detail: 'Exportação simulada...', life: 2000 });
    const visualizar = (item) => {
      router.push({ name: 'solicitacoesView', params: { id: item.id } });
    };
    const editar = (item) => router.push({ name: 'solicitacoesEdit', params: { id: item.id } });
    const alterarQuantidade = (item) => router.push({ name: 'alterarQuantidade', params: { id: item.id } });
    const alterarCentroCusto = (item) => router.push({ name: 'alterarCentroCustoSolicitacao', params: { id: item.id } });
    const excluir = async (item) => {
      confirm.require({
        message: `Tem certeza que deseja deletar a solicitação ${item.numero}?`,
        header: 'Confirmar Exclusão',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Sim, deletar',
        rejectLabel: 'Cancelar',
        accept: async () => {
          try {
            await SolicitacaoService.delete(item.id);
            toast.add({
              severity: 'success',
              summary: 'Solicitação deletada',
              detail: `${item.numero} foi deletada com sucesso.`,
              life: 3000,
            });
            await carregarSolicitacoes();
          } catch (error) {
            const detail = error?.response?.data?.message || 'Não foi possível deletar a solicitação.';
            toast.add({
              severity: 'error',
              summary: 'Erro ao deletar',
              detail,
              life: 4000,
            });
          }
        },
      });
    };

    const deletarSelecionadas = () => {
      if (!selecionadas.value.length) {
        toast.add({
          severity: 'warn',
          summary: 'Nenhuma seleção',
          detail: 'Selecione pelo menos uma solicitação para deletar.',
          life: 3000,
        });
        return;
      }

      confirm.require({
        message: `Tem certeza que deseja deletar ${selecionadas.value.length} solicitação(ões) selecionada(s)?`,
        header: 'Confirmar Exclusão',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        acceptLabel: 'Sim, deletar',
        rejectLabel: 'Cancelar',
        accept: async () => {
          try {
            const promises = selecionadas.value.map((item) => SolicitacaoService.delete(item.id));
            await Promise.all(promises);
            
            toast.add({
              severity: 'success',
              summary: 'Solicitações deletadas',
              detail: `${selecionadas.value.length} solicitação(ões) deletada(s) com sucesso.`,
              life: 3000,
            });
            
            selecionadas.value = [];
            await carregarSolicitacoes();
          } catch (error) {
            const detail = error?.response?.data?.message || 'Não foi possível deletar as solicitações.';
            toast.add({
              severity: 'error',
              summary: 'Erro ao deletar',
              detail,
              life: 4000,
            });
          }
        },
      });
    };

    const formatarCentroCusto = (centroCusto) => {
      if (!centroCusto) return '-';
      
      // Se for string (formato antigo), retornar como está
      if (typeof centroCusto === 'string') {
        return centroCusto;
      }
      
      // Se for objeto, formatar código - descrição
      if (typeof centroCusto === 'object') {
        const codigo = centroCusto?.codigo || centroCusto?.CTT_CUSTO || '';
        const descricao = centroCusto?.descricao || centroCusto?.CTT_DESC01 || '';
        
        if (codigo && descricao) {
          return `${codigo} - ${descricao}`;
        }
        
        return codigo || descricao || '-';
      }
      
      return '-';
    };

    const podeEditar = (statusSlug) => {
      // Pode editar solicitação completa apenas quando status for "aguardando" ou "reprovado"
      return statusSlug === 'aguardando' || statusSlug === 'reprovado';
    };

    const podeAlterarQuantidade = (statusSlug) => {
      // Pode alterar quantidade apenas quando status for "cotacao" ou "compra_em_andamento"
      return statusSlug === 'cotacao' || statusSlug === 'compra_em_andamento';
    };

    const statusStyle = (slug) => {
      const styles = {
        aguardando: { backgroundColor: '#FFEED0', color: '#C47F17' },
        autorizado: { backgroundColor: '#CDE7FF', color: '#1363B4' },
        cotacao: { backgroundColor: '#FFEED0', color: '#C47F17' },
        compra_em_andamento: { backgroundColor: '#CDE7FF', color: '#1363B4' },
        finalizada: { backgroundColor: '#E0D5FF', color: '#5E37B4' },
        analisada: { backgroundColor: '#BFF3E0', color: '#0F8558' },
        analisada_aguardando: { backgroundColor: '#F3F0C7', color: '#9C8A1F' },
        analise_gerencia: { backgroundColor: '#FAD7DF', color: '#B61643' },
        aprovado: { backgroundColor: '#CFF5D8', color: '#237A3F' },
      };

      return styles[slug] ?? { backgroundColor: '#E7E9EE', color: '#475569' };
    };

    return {
      solicitacoes,
      filtroGlobal,
      selecionadas,
      paginacao,
      mapaStatus,
      statusStyle,
      novaSolicitacao,
      exportar,
      visualizar,
      editar,
      alterarQuantidade,
      excluir,
      deletarSelecionadas,
      carregando,
      formatarCentroCusto,
      podeEditar,
      podeAlterarQuantidade,
      podeAlterarCentroCusto,
      alterarCentroCusto,
      onPageChange,
      onSearchChange,
    };
  },
};
</script>

<style scoped>
.card {
  border-radius: 10px;
  background: #fff;
}

/* Tabela limpa */
:deep(.p-datatable) {
  border: none !important;
}

:deep(.p-tag-success) {
  background-color: #e7f8ec !important;
  color: #0f7c2f !important;
  border-radius: 10px;
  padding: 0.3rem 1rem;
}
:deep(.p-tag-info) {
  background-color: #e7f2fa !important;
  color: #0c60b9 !important;
  border-radius: 10px;
  padding: 0.3rem 1rem;
}
:deep(.p-tag-danger) {
  background-color: #fae7e7 !important;
  color: #c02424 !important;
  border-radius: 10px;
  padding: 0.3rem 1rem;
}
</style>
