<template>
  <div class="card p-5">
    <!-- Cabeçalho -->
    <div class="flex align-items-center justify-content-between mb-4">
      <div class="flex align-items-center">
        <Button icon="pi pi-arrow-left" class="p-button-text mr-2" @click="voltar" />
        <h4 class="m-0">Alterar Quantidade de Itens</h4>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="carregando" class="flex justify-content-center align-items-center" style="min-height: 400px;">
      <ProgressSpinner />
    </div>

    <!-- Conteúdo -->
    <div v-else>
      <!-- Informações da Solicitação -->
      <div v-if="solicitacao" class="card bg-light p-4 mb-4">
      <div class="grid">
        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Número da Solicitação</label>
          <p class="text-900 font-semibold m-0">{{ solicitacao?.numero || '-' }}</p>
        </div>
        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Data</label>
          <p class="text-900 font-semibold m-0">{{ solicitacao?.data || '-' }}</p>
        </div>
        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Solicitante</label>
          <p class="text-900 font-semibold m-0">{{ solicitacao?.solicitante || '-' }}</p>
        </div>
        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Status</label>
          <Tag 
            :value="solicitacao?.status?.label || '-'" 
            :severity="getSeverityStatus(solicitacao?.status?.slug)"
            :style="getStyleStatus(solicitacao?.status?.slug)"
          />
        </div>
      </div>
    </div>

    <!-- Mensagem informativa -->
    <Message severity="info" :closable="false" class="mb-4">
      <div class="flex align-items-center">
        <i class="pi pi-info-circle mr-2"></i>
        <span>Você pode alterar apenas a quantidade dos itens. Os demais campos não podem ser modificados nesta tela.</span>
      </div>
    </Message>

    <!-- Tabela de Itens -->
    <div class="mt-4">
      <div v-if="!carregando && itens.length === 0" class="text-center p-4">
        <p class="text-600">Nenhum item encontrado nesta solicitação.</p>
      </div>
      <DataTable 
        v-else
        :value="itens" 
        class="p-datatable-sm tabela-itens" 
        responsiveLayout="scroll"
        :loading="carregando"
      >
        <Column header="N°">
          <template #body="{ index }">
            {{ index + 1 }}
          </template>
        </Column>
        
        <Column field="codigo" header="Código">
          <template #body="{ data }">
            {{ data.codigo || '-' }}
          </template>
        </Column>

        <Column field="referencia" header="Referência">
          <template #body="{ data }">
            {{ data.referencia || '-' }}
          </template>
        </Column>

        <Column field="mercadoria" header="Mercadoria">
          <template #body="{ data }">
            {{ data.mercadoria || '-' }}
          </template>
        </Column>

        <Column field="quantidade" header="Quantidade Atual">
          <template #body="{ data }">
            {{ formatarQuantidade(data.quantidade) }}
          </template>
        </Column>

        <Column field="unidade" header="Unidade">
          <template #body="{ data }">
            {{ data.unidade || '-' }}
          </template>
        </Column>

        <Column header="Nova Quantidade">
          <template #body="{ data }">
            <InputNumber 
              v-model="data.novaQuantidade" 
              class="w-full p-inputtext-sm" 
              :min="1"
              :useGrouping="false"
              :minFractionDigits="0"
              :maxFractionDigits="0"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Botões de Ação -->
    <div class="flex justify-content-end gap-2 mt-4">
      <Button 
        label="Cancelar" 
        class="p-button-outlined" 
        @click="voltar" 
        :disabled="salvando || carregando"
      />
      <Button 
        label="Salvar Alterações" 
        icon="pi pi-check" 
        class="p-button-success" 
        @click="salvar"
        :loading="salvando"
        :disabled="salvando || carregando || itens.length === 0"
      />
    </div>

    </div>

    <Toast />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import SolicitacaoService from '@/service/SolicitacaoService';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputNumber from 'primevue/inputnumber';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import ProgressSpinner from 'primevue/progressspinner';

export default {
  name: 'AlterarQuantidade',
  components: {
    Button,
    DataTable,
    Column,
    InputNumber,
    Message,
    Tag,
    Toast,
    ProgressSpinner
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();
    const service = SolicitacaoService;

    const solicitacao = ref({
      id: null,
      numero: null,
      data: null,
      solicitante: null,
      status: null
    });

    const itens = ref([]);
    const carregando = ref(false);
    const salvando = ref(false);

    const formatarQuantidade = (quantidade) => {
      if (!quantidade && quantidade !== 0) return '-';
      return parseInt(quantidade).toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };

    const getSeverityStatus = (statusSlug) => {
      const statusMap = {
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
      return statusMap[statusSlug] || 'secondary';
    };

    const getStyleStatus = (statusSlug) => {
      const styleMap = {
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
      return styleMap[statusSlug] || {};
    };

    const carregar = async () => {
      const id = route.params.id;
      if (!id) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'ID da solicitação não fornecido',
          life: 3000
        });
        router.push({ name: 'solicitacoesList' });
        return;
      }

      try {
        carregando.value = true;
        const { data } = await service.show(id);
        const detalhe = data?.data ?? {};

        console.log('Dados carregados:', detalhe);
        console.log('Itens recebidos:', detalhe.itens);

        solicitacao.value = {
          id: detalhe.id,
          numero: detalhe.numero || null,
          data: detalhe.data || null,
          solicitante: detalhe.solicitante?.label || detalhe.solicitante || null,
          status: detalhe.status || null
        };

        // Carregar itens e inicializar novaQuantidade com a quantidade atual (convertendo para inteiro)
        const itensCarregados = detalhe.itens || [];
        console.log('Total de itens:', itensCarregados.length);
        
        itens.value = itensCarregados.map(item => {
          console.log('Processando item:', item);
          const quantidadeAtual = parseInt(item.quantidade) || 0;
          return {
            id: item.id,
            codigo: item.codigo || null,
            referencia: item.referencia || null,
            mercadoria: item.mercadoria || '',
            quantidade: quantidadeAtual,
            unidade: item.unidade || null,
            aplicacao: item.aplicacao || null,
            prioridade: item.prioridade || null,
            tag: item.tag || null,
            centroCusto: item.centro_custo ? {
              codigo: item.centro_custo.codigo || item.centro_custo.CTT_CUSTO,
              descricao: item.centro_custo.descricao || item.centro_custo.CTT_DESC01,
              classe: item.centro_custo.classe || item.centro_custo.CTT_CLASSE
            } : null,
            novaQuantidade: quantidadeAtual // Inicializar com quantidade atual (inteiro)
          };
        });

        console.log('Itens processados:', itens.value);

        // Verificar se pode alterar quantidade baseado no status
        const statusSlug = solicitacao.value.status?.slug;
        const statusPermitidos = ['cotacao', 'compra_em_andamento'];
        
        if (!statusPermitidos.includes(statusSlug)) {
          toast.add({
            severity: 'warn',
            summary: 'Ação não permitida',
            detail: 'A alteração de quantidade só é permitida quando a cotação está com status "Cotação" ou "Compra em Andamento".',
            life: 5000
          });
          // Não redirecionar imediatamente, apenas mostrar aviso
        }

      } catch (error) {
        console.error('Erro ao carregar solicitação', error);
        toast.add({
          severity: 'error',
          summary: 'Erro ao carregar',
          detail: error?.response?.data?.message || 'Não foi possível carregar os dados da solicitação.',
          life: 4000
        });
        router.push({ name: 'solicitacoesList' });
      } finally {
        carregando.value = false;
      }
    };

    const salvar = async () => {
      // Validar se há alterações
      const temAlteracoes = itens.value.some(item => {
        const quantidadeAtual = parseInt(item.quantidade) || 0;
        const novaQuantidade = parseInt(item.novaQuantidade) || 0;
        return quantidadeAtual !== novaQuantidade;
      });

      if (!temAlteracoes) {
        toast.add({
          severity: 'info',
          summary: 'Nenhuma alteração',
          detail: 'Não há alterações para salvar.',
          life: 3000
        });
        return;
      }

      // Validar se todas as novas quantidades são válidas (números inteiros)
      const itensInvalidos = itens.value.filter(item => {
        const novaQuantidade = parseInt(item.novaQuantidade) || 0;
        return novaQuantidade < 1 || !Number.isInteger(parseFloat(item.novaQuantidade));
      });

      if (itensInvalidos.length > 0) {
        toast.add({
          severity: 'warn',
          summary: 'Validação',
          detail: 'Todas as quantidades devem ser números inteiros maiores que zero.',
          life: 4000
        });
        return;
      }

      try {
        salvando.value = true;

        // Preparar payload apenas com id e nova quantidade (convertendo para inteiro)
        const itensAtualizados = itens.value.map(item => ({
          id: item.id,
          quantidade: parseInt(item.novaQuantidade) || 0
        }));

        // Usar endpoint específico para alterar apenas quantidade
        await service.alterarQuantidade(solicitacao.value.id, {
          itens: itensAtualizados
        });

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Quantidades alteradas com sucesso!',
          life: 3000
        });

        // Voltar para a lista após salvar
        router.push({ name: 'solicitacoesList' });

      } catch (error) {
        console.error('Erro ao salvar alterações', error);
        toast.add({
          severity: 'error',
          summary: 'Erro ao salvar',
          detail: error?.response?.data?.message || 'Não foi possível salvar as alterações.',
          life: 4000
        });
      } finally {
        salvando.value = false;
      }
    };

    const voltar = () => {
      console.log('Botão voltar clicado');
      router.push({ name: 'solicitacoesList' }).catch(err => {
        console.error('Erro ao navegar:', err);
        // Se falhar, tentar navegação alternativa
        window.location.href = '/solicitacoes';
      });
    };

    onMounted(() => {
      carregar();
    });

    return {
      solicitacao,
      itens,
      carregando,
      salvando,
      formatarQuantidade,
      getSeverityStatus,
      getStyleStatus,
      salvar,
      voltar
    };
  }
};
</script>

<style scoped>
.card {
  border-radius: 10px;
  background: #fff;
}

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

.tabela-itens :deep(.p-inputnumber-input) {
  border: 1px solid #ddd !important;
  background: #fff !important;
  font-size: 0.9rem;
  color: #333;
}
</style>
