<template>
  <div class="card p-5 bg-page">
    <!-- Cabeçalho -->
    <div class="flex align-items-center justify-content-between mb-4">
      <div class="flex align-items-center">
        <Button icon="pi pi-arrow-left" class="p-button-text mr-2" @click="voltar" />
        <h4 class="m-0 text-900">Analisar e Selecionar Níveis de Aprovação</h4>
      </div>
      <Button
          v-if="podeResetar"
          label="Resetar Solicitação"
          icon="pi pi-refresh"
          class="p-button-outlined p-button-warning"
          @click="abrirModalResetar"
      />
    </div>

    <!-- Modal Resetar Solicitação -->
    <Dialog
        v-model:visible="modalResetarVisible"
        header="Resetar Solicitação"
        :modal="true"
        :closable="true"
        :style="{ width: '500px' }"
        @hide="fecharModalResetar"
    >
      <p class="text-600 mb-3">
        A solicitação voltará para o status <strong>Aguardando</strong>. As assinaturas serão removidas e o solicitante poderá ver o motivo e editar a solicitação. Os fornecedores serão mantidos.
      </p>
      <label class="block text-600 mb-2">Por que está resetando? (obrigatório)</label>
      <Textarea
          v-model="motivoResetar"
          rows="4"
          placeholder="Digite o motivo do reset..."
          class="w-full mb-3"
      />
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" class="p-button-secondary" @click="fecharModalResetar" />
        <Button
            label="Resetar"
            icon="pi pi-refresh"
            class="p-button-warning"
            :loading="loadingResetar"
            :disabled="!motivoResetar || !motivoResetar.trim()"
            @click="confirmarResetar"
        />
      </template>
    </Dialog>

    <!-- Bloco Identificação -->
    <div class="card shadow-none bg-light p-4 mb-4" v-if="cotacao">
      <h5 class="mb-3 text-900">Identificação da Solicitação</h5>

      <div class="grid text-sm">
        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Número da solicitação</label>
          <p class="text-900 font-semibold">{{ cotacao.numero }}</p>
        </div>

        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Data da Solicitação</label>
          <p class="text-900 font-semibold">{{ cotacao.data }}</p>
        </div>

        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Empresa</label>
          <p class="text-900 font-semibold">{{ cotacao.empresa }}</p>
        </div>

        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Local</label>
          <p class="text-900 font-semibold">{{ cotacao.local || '-' }}</p>
        </div>

        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Solicitante</label>
          <p class="text-900 font-semibold">{{ cotacao.solicitante }}</p>
        </div>
      </div>

      <!-- Tabela de Itens -->
      <DataTable
          :value="cotacao.itens"
          class="p-datatable-sm tabela-aprovar mt-4"
          responsiveLayout="scroll"
          v-if="cotacao.itens && cotacao.itens.length > 0"
      >
        <Column field="codigo" header="Código" />
        <Column field="referencia" header="Referência" />
        <Column field="mercadoria" header="Mercadoria" />
        <Column field="quantidade" header="Quant solicitada" />
        <Column field="unidade" header="Medida" />
        <Column field="aplicacao" header="Aplicação" />
        <Column field="prioridade" header="Prioridade dias" />
        <Column field="tag" header="TAG" />
        <Column field="centro_custo" header="Centro de custo" />
      </DataTable>

      <!-- Observação -->
      <div class="mt-4" v-if="cotacao.observacao">
        <label class="block text-600 mb-1">Observação</label>
        <p class="text-900">{{ cotacao.observacao }}</p>
      </div>
    </div>

    <!-- Seleção de Níveis de Aprovação -->
    <div class="card shadow-none bg-light p-4 mb-4">
      <h5 class="mb-3 text-900">Selecionar Níveis de Aprovação</h5>
      <p class="text-600 mb-4">Selecione quais níveis hierárquicos precisam aprovar esta cotação:</p>

      <div class="grid">
        <div class="col-12 md:col-6" v-for="nivel in niveisDisponiveis" :key="nivel.value">
          <div class="flex align-items-center">
            <Checkbox
                :inputId="nivel.value"
                v-model="niveisSelecionados"
                :value="nivel.value"
                :binary="false"
            />
            <label :for="nivel.value" class="ml-2 text-900 font-medium cursor-pointer">
              {{ nivel.label }}
            </label>
          </div>
        </div>
      </div>

      <Message severity="error" v-if="erroValidacao" class="mt-3">
        {{ erroValidacao }}
      </Message>
    </div>

    <!-- Campo de Observação -->
    <div class="card shadow-none bg-light p-4 mb-4">
      <h5 class="mb-3 text-900">Observação</h5>
      <Textarea
          v-model="observacao"
          rows="4"
          placeholder="Digite uma observação sobre a análise e seleção dos níveis de aprovação..."
          class="w-full"
      />
    </div>

    <!-- Botões -->
    <div class="flex justify-content-end gap-2">
      <Button
          label="Cancelar"
          icon="pi pi-times"
          class="p-button-secondary"
          @click="voltar"
      />
      <Button
          label="Enviar para Comprador"
          icon="pi pi-check"
          class="p-button-success"
          @click="salvar"
          :loading="loading"
      />
    </div>

    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import SolicitacaoService from '@/service/SolicitacaoService';

const STATUS_PERMITIDOS_RESETAR = [
  'em_analise_supervisor',
  'autorizado',
  'cotacao',
  'finalizada',
  'analisada',
  'analisada_aguardando',
  'analise_gerencia',
];

export default {
  name: 'CotacaoAnalisarAprovacoes',
  components: { Dialog },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();

    const cotacao = ref(null);
    const loading = ref(false);
    const niveisSelecionados = ref([]);
    const observacao = ref('');
    const erroValidacao = ref('');
    const modalResetarVisible = ref(false);
    const motivoResetar = ref('');
    const loadingResetar = ref(false);

    const podeResetar = computed(() => {
      if (!cotacao.value?.status?.slug) return false;
      return STATUS_PERMITIDOS_RESETAR.includes(cotacao.value.status.slug);
    });

    const niveisDisponiveis = [
      { value: 'COMPRADOR', label: 'COMPRADOR' },
      { value: 'GERENTE_LOCAL', label: 'GERENTE LOCAL' },
      { value: 'ENGENHEIRO', label: 'ENGENHEIRO' },
      { value: 'GERENTE_GERAL', label: 'GERENTE GERAL' },
      { value: 'DIRETOR', label: 'DIRETOR' },
      { value: 'PRESIDENTE', label: 'PRESIDENTE' },
    ];

    const carregarCotacao = async () => {
      try {
        loading.value = true;
        const response = await SolicitacaoService.show(route.params.id);
        cotacao.value = response.data.data;
        
        // Se já houver níveis selecionados, carregar
        if (cotacao.value.aprovacoes && cotacao.value.aprovacoes.length > 0) {
          niveisSelecionados.value = cotacao.value.aprovacoes
            .filter(ap => ap.required)
            .map(ap => ap.level);
        }
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao carregar cotação',
          life: 3000
        });
      } finally {
        loading.value = false;
      }
    };

    const salvar = async () => {
      erroValidacao.value = '';

      // Validação
      if (niveisSelecionados.value.length === 0) {
        erroValidacao.value = 'Selecione pelo menos um nível de aprovação.';
        return;
      }

      try {
        loading.value = true;
        
        const payload = {
          niveis_aprovacao: niveisSelecionados.value,
          observacao: observacao.value || null,
        };

        await SolicitacaoService.analyzeAndSelectApprovals(route.params.id, payload);

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Níveis de aprovação selecionados com sucesso!',
          life: 3000
        });

        // Redirecionar após 1 segundo
        setTimeout(() => {
          router.push({ name: 'cotacoes-list' });
        }, 1000);
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao salvar níveis de aprovação',
          life: 3000
        });
      } finally {
        loading.value = false;
      }
    };

    const voltar = () => {
      router.back();
    };

    const abrirModalResetar = () => {
      motivoResetar.value = '';
      modalResetarVisible.value = true;
    };

    const fecharModalResetar = () => {
      modalResetarVisible.value = false;
      motivoResetar.value = '';
    };

    const confirmarResetar = async () => {
      const motivo = (motivoResetar.value || '').trim();
      if (!motivo) return;
      try {
        loadingResetar.value = true;
        await SolicitacaoService.resetSolicitacao(route.params.id, { motivo });
        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Solicitação resetada com sucesso. O solicitante poderá ver o motivo e editar.',
          life: 4000,
        });
        fecharModalResetar();
        setTimeout(() => {
          router.push({ name: 'cotacoes-list' });
        }, 1000);
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao resetar solicitação',
          life: 3000,
        });
      } finally {
        loadingResetar.value = false;
      }
    };

    onMounted(() => {
      carregarCotacao();
    });

    return {
      cotacao,
      loading,
      niveisSelecionados,
      observacao,
      erroValidacao,
      niveisDisponiveis,
      salvar,
      voltar,
      podeResetar,
      modalResetarVisible,
      motivoResetar,
      loadingResetar,
      abrirModalResetar,
      fecharModalResetar,
      confirmarResetar,
    };
  },
};
</script>

<style scoped>
.tabela-aprovar {
  font-size: 0.875rem;
}
</style>

