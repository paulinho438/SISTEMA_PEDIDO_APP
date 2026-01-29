<template>
  <div class="card p-5 bg-page">
    <div class="flex align-items-center mb-4">
      <Button icon="pi pi-arrow-left" class="p-button-text mr-2" @click="voltar" />
      <h4 class="m-0 text-900">Vincular solicitação</h4>
    </div>

    <div class="card shadow-none bg-light p-4 mb-4">
      <div class="flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 text-900">Vincule o comprador</h5>
        <span v-if="carregando" class="text-600 text-sm">Carregando...</span>
      </div>

      <div class="grid">
        <div class="col-12 md:col-4">
          <label class="block text-600 mb-2">Comprador</label>
          <Dropdown
              v-model="compradorSelecionado"
              :options="compradores"
              optionLabel="label"
              optionValue="value"
              placeholder="Comprador"
              class="w-full"
              :loading="carregando"
          />
        </div>
        <div class="col-12 md:col-8">
          <label class="block text-600 mb-2">Observações / instruções</label>
          <Textarea v-model="observacaoAprovacao" rows="3" class="w-full" placeholder="Informe observações para o comprador" />
        </div>
      </div>
    </div>

    <!-- Seleção de Engenheiro (quando ENGENHEIRO está selecionado) -->
    <div v-if="niveisSelecionados.includes('ENGENHEIRO')" class="card shadow-none bg-light p-4 mb-4">
      <div class="flex justify-content-between align-items-center mb-3">
        <h5 class="mb-0 text-900">Vincule o engenheiro</h5>
        <span v-if="carregando" class="text-600 text-sm">Carregando...</span>
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <label class="block text-600 mb-2">Engenheiro <span class="text-red-500">*</span></label>
          <Dropdown
              v-model="engenheiroSelecionado"
              :options="engenheiros"
              optionLabel="label"
              optionValue="value"
              placeholder="Selecione o engenheiro"
              class="w-full"
              :loading="carregando"
          />
        </div>
      </div>
    </div>

    <!-- Seleção de Níveis de Aprovação -->
    <div class="card shadow-none bg-light p-4 mb-4">
      <h5 class="mb-3 text-900">Selecionar Níveis de Aprovação</h5>
      <p class="text-600 mb-3">
        Selecione quais níveis hierárquicos precisam aprovar esta cotação. 
        <strong>O comprador sempre assina, pois é responsável por montar a cotação.</strong>
      </p>

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

      <Message severity="error" v-if="erroValidacaoAprovacoes" class="mt-3">
        {{ erroValidacaoAprovacoes }}
      </Message>
    </div>

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

        <div class="col-12 md:col-4" v-if="solicitacao.centro_custo">
          <label class="text-600 block mb-1">Centro de custo principal</label>
          <p class="text-900 font-semibold">
            {{ solicitacao.centro_custo?.codigo }}
            <span v-if="solicitacao.centro_custo?.descricao">
              - {{ solicitacao.centro_custo?.descricao }}
            </span>
          </p>
        </div>
      </div>

      <DataTable
          :value="tabelaItens"
          class="p-datatable-sm tabela-vincular mt-4"
          responsiveLayout="scroll"
      >
        <Column header="N°">
          <template #body="{ index }">
            {{ index + 1 }}
          </template>
        </Column>
        <Column field="codigo" header="Código" />
        <Column field="referencia" header="Referência" />
        <Column field="mercadoria" header="Mercadoria" />
        <Column field="quantidade" header="Quant solicitada" />
        <Column field="unidade" header="Medida" />
        <Column field="aplicacao" header="Aplicação" />
        <Column field="prioridade" header="Prioridade dias" />
        <Column field="tag" header="TAG" />
        <Column header="Centro de custo">
          <template #body="{ data }">
            {{ formatarCentroCusto(data.centroCusto) }}
          </template>
        </Column>
      </DataTable>

      <div class="mt-4">
        <label class="block text-600 mb-1">Observação</label>
        <p class="text-900">{{ solicitacao.observacao || '-' }}</p>
      </div>
    </div>

    <div class="flex justify-content-end mt-4">
      <Button
          label="Vincular"
          icon="pi pi-link"
          class="p-button-success"
          :loading="salvando"
          :disabled="salvando"
          @click="vincular"
      />
    </div>

    <Toast />
  </div>
</template>

<script>
import { reactive, ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import SolicitacaoService from '@/service/SolicitacaoService';

export default {
  name: 'VincularSolicitacao',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();

    const solicitacao = reactive({
      id: null,
      numero: '',
      data: '',
      empresa: '',
      local: '',
      solicitante: '',
      observacao: '',
      centro_custo: null,
      items: [],
      status: null,
    });

    const compradores = ref([]);
    const compradorSelecionado = ref(null);
    const engenheiros = ref([]);
    const engenheiroSelecionado = ref(null);
    const observacaoAprovacao = ref('');
    const carregando = ref(false);
    const salvando = ref(false);
    const erroValidacaoAprovacoes = ref('');

    // Níveis disponíveis (sem COMPRADOR, pois ele sempre assina)
    const niveisDisponiveis = [
      { value: 'GERENTE_LOCAL', label: 'Gerente Local Compras' },
      { value: 'ENGENHEIRO', label: 'ENGENHEIRO' },
      { value: 'GERENTE_GERAL', label: 'Gerente Geral Compras' },
      { value: 'DIRETOR', label: 'DIRETOR' },
      { value: 'PRESIDENTE', label: 'PRESIDENTE' },
    ];

    // Pré-selecionar todos os níveis por padrão
    const niveisSelecionados = ref(niveisDisponiveis.map(n => n.value));

    const tabelaItens = computed(() =>
      solicitacao.items.map((item) => ({
        codigo: item.codigo,
        referencia: item.referencia,
        mercadoria: item.mercadoria,
        quantidade: item.quantidade,
        unidade: item.unidade,
        aplicacao: item.aplicacao,
        prioridade: item.prioridade,
        tag: item.tag,
        centroCusto: item.centro_custo,
      }))
    );

    const carregarDados = async () => {
      try {
        carregando.value = true;
        const solicitacaoId = route.params.id;
        const { data } = await SolicitacaoService.show(solicitacaoId);

        const detalhe = data?.data ?? {};

        solicitacao.id = detalhe.id;
        solicitacao.numero = detalhe.numero;
        solicitacao.data = detalhe.data;
        solicitacao.empresa = detalhe.empresa;
        solicitacao.local = detalhe.local;
        solicitacao.solicitante = detalhe.solicitante;
        solicitacao.observacao = detalhe.observacao;
        solicitacao.centro_custo = detalhe.centro_custo;
        solicitacao.items = detalhe.itens || [];
        solicitacao.status = detalhe.status;

        compradores.value = (data?.buyers ?? []).map((buyer) => ({
          label: buyer.label,
          value: buyer.id,
        }));

        engenheiros.value = (data?.engineers ?? []).map((engineer) => ({
          label: engineer.label,
          value: engineer.id,
        }));

        if (detalhe.engineer?.id) {
          engenheiroSelecionado.value = detalhe.engineer.id;
        }

        if (detalhe.status?.slug !== 'autorizado') {
          toast.add({ severity: 'info', summary: 'Solicitação pendente', detail: 'Esta solicitação ainda não foi autorizada.', life: 3000 });
          const destino = detalhe.status?.slug === 'aguardando' ? 'aprovarSolicitacao' : 'solicitacoesPendentes';
          router.push({ name: destino, params: { id: String(route.params.id) } });
          return;
        }

        if (detalhe.buyer?.id) {
          compradorSelecionado.value = detalhe.buyer.id;
        }

        // Se já houver níveis selecionados, carregar (excluindo COMPRADOR)
        // Caso contrário, manter todos pré-selecionados
        if (detalhe.aprovacoes && detalhe.aprovacoes.length > 0) {
          const niveisJaSelecionados = detalhe.aprovacoes
            .filter(ap => ap.required && ap.level !== 'COMPRADOR')
            .map(ap => ap.level);
          
          // Se houver níveis já selecionados, usar eles; senão, manter todos pré-selecionados
          if (niveisJaSelecionados.length > 0) {
            niveisSelecionados.value = niveisJaSelecionados;
          }
          // Se não houver níveis selecionados, manter o padrão (todos selecionados)
        }
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível carregar a solicitação.';
        toast.add({ severity: 'error', summary: 'Erro', detail, life: 4000 });
        router.push({ name: 'solicitacoesPendentes' });
      } finally {
        carregando.value = false;
      }
    };

    const vincular = async () => {
      erroValidacaoAprovacoes.value = '';

      if (!compradorSelecionado.value) {
        toast.add({
          severity: 'warn',
          summary: 'Seleção obrigatória',
          detail: 'Escolha um comprador antes de vincular.',
          life: 3000,
        });
        return;
      }

      // Se ENGENHEIRO está selecionado, verificar se um engenheiro foi escolhido
      if (niveisSelecionados.value.includes('ENGENHEIRO') && !engenheiroSelecionado.value) {
        toast.add({
          severity: 'warn',
          summary: 'Seleção obrigatória',
          detail: 'Escolha um engenheiro antes de vincular.',
          life: 3000,
        });
        return;
      }

      try {
        salvando.value = true;

        // Validar permissões ANTES de executar qualquer operação
        // Se ENGENHEIRO está selecionado, verificar se o usuário tem permissão para atribuir engenheiro
        if (niveisSelecionados.value.includes('ENGENHEIRO') && engenheiroSelecionado.value) {
          // Tentar atribuir engenheiro primeiro para validar permissão
          // Se falhar, não executar nenhuma outra operação
          try {
            await SolicitacaoService.assignEngineer(solicitacao.id, {
              engineer_id: engenheiroSelecionado.value,
              observacao: observacaoAprovacao.value,
            });
          } catch (error) {
            // Se falhar, não continuar com as outras operações
            throw error;
          }
        }

        // 1. Vincular comprador (após validar engenheiro se necessário)
        await SolicitacaoService.assignBuyer(solicitacao.id, {
          buyer_id: compradorSelecionado.value,
          observacao: observacaoAprovacao.value,
        });

        // 3. Selecionar níveis de aprovação (incluindo COMPRADOR automaticamente)
        if (niveisSelecionados.value.length > 0) {
          // Adicionar COMPRADOR automaticamente, pois ele sempre assina
          const niveisComComprador = ['COMPRADOR', ...niveisSelecionados.value];
          
          await SolicitacaoService.analyzeAndSelectApprovals(solicitacao.id, {
            niveis_aprovacao: niveisComComprador,
            observacao: observacaoAprovacao.value || null,
          });
        }

        toast.add({
          severity: 'success',
          summary: 'Solicitação vinculada',
          detail: `Solicitação ${solicitacao.numero} vinculada com sucesso.`,
          life: 3000,
        });

        router.push({ name: 'solicitacoesPendentes' });
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível vincular a solicitação.';
        toast.add({ severity: 'error', summary: 'Erro ao vincular', detail, life: 4000 });
      } finally {
        salvando.value = false;
      }
    };

    const voltar = () => router.push({ name: 'solicitacoesPendentes' });

    const formatarCentroCusto = (centroCusto) => {
      if (!centroCusto) return '-';
      
      // Se for string, retornar como está
      if (typeof centroCusto === 'string') {
        return centroCusto;
      }
      
      // Se for objeto, formatar como "codigo - descricao"
      if (typeof centroCusto === 'object') {
        const codigo = centroCusto?.codigo || centroCusto?.CTT_CUSTO || '';
        const descricao = centroCusto?.descricao || centroCusto?.CTT_DESC01 || '';
        
        if (codigo && descricao) {
          return `${codigo} - ${descricao}`;
        }
        if (codigo) {
          return codigo;
        }
        if (descricao) {
          return descricao;
        }
      }
      
      return '-';
    };

    onMounted(carregarDados);

    return {
      solicitacao,
      compradores,
      compradorSelecionado,
      engenheiros,
      engenheiroSelecionado,
      observacaoAprovacao,
      niveisSelecionados,
      niveisDisponiveis,
      erroValidacaoAprovacoes,
      vincular,
      voltar,
      carregando,
      salvando,
      tabelaItens,
      formatarCentroCusto,
    };
  },
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
