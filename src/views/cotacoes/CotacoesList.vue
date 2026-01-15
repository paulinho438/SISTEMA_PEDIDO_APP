<template>
  <div class="card p-5 bg-page">
    <!-- Cabeçalho -->
    <div class="flex justify-content-between align-items-center mb-3">
      <div></div>
      <Button label="Exportar" icon="pi pi-upload" class="p-button-outlined" @click="exportar" />
    </div>

    <!-- Título -->
    <h5 class="text-900 mb-3">Listagem de Cotações Pendentes</h5>

    <!-- Filtros -->
    <div class="flex justify-content-between align-items-center mb-3">
        <div class="flex align-items-center">
            <Checkbox
                v-model="filtrarMinhasCotacoes"
                inputId="filtrarMinhasCotacoes"
                binary
                @change="onFilterChange"
            />
            <label for="filtrarMinhasCotacoes" class="ml-2">Mostrar apenas minhas cotações</label>
        </div>
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
        :value="cotacoesFiltradas"
        :paginator="true"
        :rows="5"
        dataKey="id"
        responsiveLayout="scroll"
        class="p-datatable-sm tabela-cotacoes"
        :loading="carregando"
    >
      <Column field="numero" header="Nº da Cotação" sortable></Column>
      <Column field="solicitacao" header="Solicitação vinculada" sortable></Column>
      <Column field="comprador" header="Comprador responsável" sortable></Column>
      <Column field="dataInicio" header="Data de início" sortable></Column>
      <Column field="valorTotal" header="Valor total" sortable>
        <template #body="slotProps">
          {{ formatarValor(slotProps.data.valorTotal) }}
        </template>
      </Column>
      <Column field="status" header="Status" sortable>
        <template #body="slotProps">
          <Tag
              :value="slotProps.data.status"
              :severity="getCorStatus(slotProps.data.statusSlug)"
              :style="getEstiloStatus(slotProps.data.statusSlug)"
          />
        </template>
      </Column>

      <Column header="Ações">
        <template #body="slotProps">
          <div class="flex gap-1">
            <Button
                icon="pi pi-eye"
                class="p-button-rounded p-button-text p-button-info"
                @click="visualizar(slotProps.data)"
                v-tooltip.top="'Visualizar cotação'"
            />
            <Button
                v-if="podeAnalisarAprovacoes(slotProps.data.statusSlug)"
                icon="pi pi-check-square"
                class="p-button-rounded p-button-text p-button-warning"
                @click="analisarAprovacoes(slotProps.data)"
                v-tooltip.top="'Analisar e Selecionar Aprovações'"
            />
            <Button
                v-if="slotProps.data.statusSlug === 'aprovado' && !slotProps.data.temPedidos"
                icon="pi pi-shopping-cart"
                class="p-button-rounded p-button-text p-button-success"
                @click="gerarPedidos(slotProps.data)"
                :loading="gerandoPedidos[slotProps.data.id]"
                v-tooltip.top="'Gerar pedidos de compra'"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { ToastSeverity } from 'primevue/api';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import SolicitacaoService from '@/service/SolicitacaoService';
import PurchaseOrderService from '@/service/PurchaseOrderService';

export default {
  name: 'CotacoesPendentes',
  setup() {
    const toast = useToast();
    const router = useRouter();
    const store = useStore();

    const cotacoes = ref([]);
    const filtroGlobal = ref('');
    const filtrarMinhasCotacoes = ref(true); // Por padrão, mostrar apenas minhas cotações
    const carregando = ref(false);
    const gerandoPedidos = ref({});
    const orderService = new PurchaseOrderService();

    // Verificar se o usuário é comprador ou tem outro perfil de aprovação
    const isBuyer = computed(() => {
      const usuario = store.state.usuario;
      if (!usuario || !usuario.permissions || !Array.isArray(usuario.permissions)) {
        return false;
      }
      
      // Verificar se o usuário tem grupo/permissão de Comprador
      for (const perm of usuario.permissions) {
        if (perm.permissions && Array.isArray(perm.permissions)) {
          // Verificar o nome do grupo
          const groupName = perm.name?.toLowerCase() || '';
          if (groupName.includes('comprador') || groupName.includes('buyer')) {
            return true;
          }
        }
      }
      return false;
    });

    const carregar = async () => {
      try {
        carregando.value = true;
        const params = { per_page: 100 };
        if (filtrarMinhasCotacoes.value) {
          // Se o checkbox está marcado:
          // - Se for COMPRADOR, filtrar por minhas cotações (buyer_id)
          // - Se for outro perfil (Engenheiro, Gerente, etc.), filtrar por aprovações pendentes
          if (isBuyer.value) {
            params.my_quotes = 'true';
          } else {
            params.my_approvals = 'true';
          }
        }
        // Se o checkbox não está marcado, não aplicar nenhum filtro (mostrar todas as cotações)
        const { data } = await SolicitacaoService.list(params);
        const pendentes = (data?.data || []).filter((item) =>
          [
            'aguardando',
            'autorizado',
            'em_analise_supervisor',
            'cotacao',
            'compra_em_andamento',
            'finalizada',
            'analisada',
            'analisada_aguardando',
            'analise_gerencia',
            'aprovado',
          ].includes(item.status?.slug)
        );

        cotacoes.value = pendentes.map((item) => ({
          id: item.id,
          numero: item.numero,
          solicitacao: item.solicitacao ?? item.numero_solicitacao ?? '-',
          comprador: item.buyer?.name || item.buyer?.label || '-',
          dataInicio: item.data ?? '-',
          valorTotal: item.valor_total ?? 0,
          status: item.status?.label || '-',
          statusSlug: item.status?.slug,
          temPedidos: (item.orders_count || 0) > 0,
        }));
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível carregar as cotações.';
        toast.add({ severity: 'error', summary: 'Erro ao carregar', detail, life: 4000 });
      } finally {
        carregando.value = false;
      }
    };

    onMounted(carregar);

    const cotacoesFiltradas = computed(() => {
      if (!filtroGlobal.value) return cotacoes.value;
      const termo = filtroGlobal.value.toLowerCase();
      return cotacoes.value.filter((c) =>
        Object.values(c)
          .join(' ')
          .toLowerCase()
          .includes(termo)
      );
    });

    const formatarValor = (valor) => {
      return Number(valor || 0).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    };

    const getCorStatus = (statusSlug) => {
      if (statusSlug === 'cotacao') return 'warning';
      if (statusSlug === 'compra_em_andamento') return 'info';
      if (statusSlug === 'finalizada') return 'info';
      if (statusSlug === 'analisada') return 'success';
      if (statusSlug === 'analisada_aguardando') return 'warning';
      if (statusSlug === 'analise_gerencia') return 'danger';
      if (statusSlug === 'aprovado') return 'success';
      return 'secondary';
    };

    const getEstiloStatus = (statusSlug) => {
      const estilos = {
        cotacao: { backgroundColor: '#FFEED0', color: '#C47F17', borderRadius: '8px' },
        compra_em_andamento: { backgroundColor: '#CDE7FF', color: '#1363B4', borderRadius: '8px' },
        finalizada: { backgroundColor: '#E0D5FF', color: '#5E37B4', borderRadius: '8px' },
        analisada: { backgroundColor: '#BFF3E0', color: '#0F8558', borderRadius: '8px' },
        analisada_aguardando: { backgroundColor: '#F3F0C7', color: '#9C8A1F', borderRadius: '8px' },
        analise_gerencia: { backgroundColor: '#FAD7DF', color: '#B61643', borderRadius: '8px' },
        aprovado: { backgroundColor: '#CFF5D8', color: '#237A3F', borderRadius: '8px' },
      };

      return estilos[statusSlug] ?? {};
    };

    const visualizar = (item) => {
      toast.add({
        severity: ToastSeverity.INFO,
        summary: 'Visualizar cotação',
        detail: `Abrindo detalhes da ${item.numero}`,
        life: 2500,
      });

      router.push({ name: 'novaCotacao', params: { id: item.id } });
    };

    const exportar = () => {
      toast.add({
        severity: ToastSeverity.SUCCESS,
        summary: 'Exportação concluída',
        detail: 'Arquivo gerado com sucesso (mock)',
        life: 2500,
      });
    };

    const gerarPedidos = async (cotacao) => {
      if (gerandoPedidos.value[cotacao.id]) {
        return;
      }

      try {
        gerandoPedidos.value[cotacao.id] = true;

        const { data } = await orderService.gerarPedidosCotacao(cotacao.id);

        toast.add({
          severity: 'success',
          summary: 'Pedidos gerados',
          detail: data.message || 'Pedidos de compra gerados com sucesso!',
          life: 4000,
        });

        // Recarregar lista para atualizar status
        await carregar();
      } catch (error) {
        const detail = error?.response?.data?.message || error?.response?.data?.error || 'Erro ao gerar pedidos de compra';
        toast.add({
          severity: 'error',
          summary: 'Erro ao gerar pedidos',
          detail,
          life: 4000,
        });
      } finally {
        gerandoPedidos.value[cotacao.id] = false;
      }
    };

    const podeAnalisarAprovacoes = (statusSlug) => {
      // Permitir análise quando está em "aguardando" ou "autorizado" (antes de atribuir comprador)
      return ['aguardando', 'autorizado', 'em_analise_supervisor'].includes(statusSlug);
    };

    const analisarAprovacoes = (cotacao) => {
      router.push({ name: 'cotacao-analisar-aprovacoes', params: { id: String(cotacao.id) } });
    };

    const onFilterChange = () => {
      console.log('Filtro mudou:', filtrarMinhasCotacoes.value);
      carregar();
    };

    return {
      cotacoes,
      filtroGlobal,
      filtrarMinhasCotacoes,
      cotacoesFiltradas,
      visualizar,
      exportar,
      gerarPedidos,
      gerandoPedidos,
      formatarValor,
      getCorStatus,
      getEstiloStatus,
      carregando,
      podeAnalisarAprovacoes,
      analisarAprovacoes,
      onFilterChange,
      carregar,
    };
  },
};
</script>

<style scoped>
.bg-page {
  background-color: #f6f9fb;
}

/* Cabeçalho da tabela */
.tabela-cotacoes :deep(.p-datatable-thead > tr > th) {
  background-color: #f9fafb;
  color: #333;
  font-weight: 600;
  border: none;
  border-bottom: 1px solid #eaeaea;
}

/* Linhas da tabela */
.tabela-cotacoes :deep(.p-datatable-tbody > tr > td) {
  border: none;
  border-bottom: 1px solid #f0f0f0;
  color: #444;
}

/* Hover */
.tabela-cotacoes :deep(.p-datatable-tbody > tr:hover > td) {
  background-color: #f7fafa;
}

/* Estilo dos ícones */
:deep(.p-button-info.p-button-text) {
  color: #1e90ff !important;
}

/* Paginação */
:deep(.p-paginator-bottom) {
  border-top: none !important;
  background: transparent !important;
}

/* Tags de status */
:deep(.p-tag-warning),
:deep(.p-tag-info) {
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.85rem;
  padding: 0.3rem 1rem;
}

/* Botão exportar */
:deep(.p-button-outlined) {
  font-size: 0.9rem;
  font-weight: 500;
  padding: 0.5rem 1.2rem;
}

/* Busca */
:deep(.p-inputtext) {
  font-size: 0.9rem;
}
</style>
