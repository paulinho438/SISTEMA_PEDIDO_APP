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
                    />
                </span>
      </div>
    </div>

    <!-- Tabela -->
    <DataTable
        :value="filtrarSolicitacoes"
        :paginator="true"
        :rows="perPage"
        dataKey="id"
        responsiveLayout="scroll"
        v-model:selection="selecionadas"
        selectionMode="checkbox"
        :loading="carregando"
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

      <Column header="Ações" style="width: 10rem">
        <template #body="slotProps">
          <div class="flex justify-content-around">
            <Button
                icon="pi pi-eye"
                class="p-button-rounded p-button-text"
                @click="visualizar(slotProps.data)"
            />
            <Button
                v-if="podeEditar(slotProps.data.statusSlug)"
                icon="pi pi-pencil"
                class="p-button-rounded p-button-text p-button-success"
                @click="editar(slotProps.data)"
                v-tooltip.top="'Editar solicitação'"
            />
            <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-text p-button-danger"
                @click="excluir(slotProps.data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Modal de Confirmação de Exclusão -->
    <ConfirmDialog />

    <!-- Rodapé -->
    <div class="flex justify-content-between align-items-center mt-3 text-sm text-500">
            <span>
                Mostrando {{ (paginaAtual - 1) * perPage + 1 }} a
                {{ Math.min(paginaAtual * perPage, solicitacoes.length) }} de
                {{ solicitacoes.length }} solicitações
            </span>

      <Dropdown
          v-model="perPage"
          :options="[10, 20, 30]"
          class="w-6rem"
      />
    </div>
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
    const perPage = ref(10);
    const paginaAtual = ref(1);
    const carregando = ref(false);

    // Verificar se o usuário tem permissão para visualizar todas as solicitações
    const podeVerTodas = computed(() => {
      return permissionService.hasPermissions('view_all_solicitacoes');
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
        
        // Se não tiver permissão para ver todas, filtrar apenas as do usuário logado
        const params = { per_page: 100 };
        if (!podeVerTodas.value) {
          params.my_requests = 'true';
        }
        
        const { data } = await SolicitacaoService.list(params);
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
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível carregar as solicitações.';
        toast.add({ severity: 'error', summary: 'Erro ao carregar', detail, life: 4000 });
      } finally {
        carregando.value = false;
      }
    };

    onMounted(carregarSolicitacoes);

    const filtrarSolicitacoes = computed(() => {
      if (!filtroGlobal.value) return solicitacoes.value;
      return solicitacoes.value.filter((s) =>
        Object.values(s)
          .join(' ')
          .toLowerCase()
          .includes(filtroGlobal.value.toLowerCase())
      );
    });

    const novaSolicitacao = () => router.push({ name: 'solicitacoesAdd' });
    const exportar = () => toast.add({ severity: 'info', summary: 'Exportar', detail: 'Exportação simulada...', life: 2000 });
    const visualizar = (item) => {
      router.push({ name: 'solicitacoesView', params: { id: item.id } });
    };
    const editar = (item) => router.push({ name: 'solicitacoesEdit', params: { id: item.id } });
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
      // Só pode editar solicitações com status "aguardando" ou "reprovado"
      return statusSlug === 'aguardando' || statusSlug === 'reprovado';
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
      perPage,
      paginaAtual,
      filtrarSolicitacoes,
      mapaStatus,
      statusStyle,
      novaSolicitacao,
      exportar,
      visualizar,
      editar,
      excluir,
      deletarSelecionadas,
      carregando,
      formatarCentroCusto,
      podeEditar,
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
