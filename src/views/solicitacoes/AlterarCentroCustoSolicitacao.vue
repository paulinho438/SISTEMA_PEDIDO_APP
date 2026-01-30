<template>
  <div class="card p-5">
    <div class="flex align-items-center justify-content-between mb-4">
      <div class="flex align-items-center">
        <Button icon="pi pi-arrow-left" class="p-button-text mr-2" @click="voltar" />
        <h4 class="m-0">Alterar Centro de Custo dos Itens</h4>
      </div>
    </div>

    <div v-if="carregando" class="flex justify-content-center align-items-center" style="min-height: 400px;">
      <ProgressSpinner />
    </div>

    <div v-else>
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

      <Message severity="info" :closable="false" class="mb-4">
        Altere o centro de custo de cada item conforme necessário. Clique em "Selecionar" na coluna Centro de custo para escolher outro centro.
      </Message>

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
          <Column field="quantidade" header="Quantidade">
            <template #body="{ data }">
              {{ formatarQuantidade(data.quantidade) }}
            </template>
          </Column>
          <Column field="unidade" header="Unidade">
            <template #body="{ data }">
              {{ data.unidade || '-' }}
            </template>
          </Column>
          <Column header="Centro de custo">
            <template #body="{ data, index }">
              <div class="p-inputgroup centro-custo-input">
                <InputText
                  :value="centroCustoLabel(data.centroCusto)"
                  class="p-inputtext-sm"
                  readonly
                  placeholder="Nenhum"
                />
                <Button
                  icon="pi pi-search"
                  class="p-button-outlined"
                  @click="abrirModalCentroCusto(index)"
                  v-tooltip.top="'Selecionar centro de custo'"
                />
                <Button
                  v-if="data.centroCusto"
                  icon="pi pi-times"
                  class="p-button-outlined p-button-danger"
                  @click="limparCentroCusto(index)"
                  v-tooltip.top="'Limpar'"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <div class="flex justify-content-end gap-2 mt-4">
        <Button
          label="Cancelar"
          class="p-button-outlined"
          @click="voltar"
          :disabled="salvando || carregando"
        />
        <Button
          label="Salvar alterações"
          icon="pi pi-check"
          class="p-button-success"
          @click="salvar"
          :loading="salvando"
          :disabled="salvando || carregando || itens.length === 0"
        />
      </div>
    </div>

    <!-- Modal Selecionar centro de custo -->
    <Dialog
      v-model:visible="modalCentro.visible"
      header="Selecionar centro de custo"
      :style="{ width: '50vw', maxWidth: '800px' }"
      modal
      appendTo="body"
      @hide="fecharModalCentroCusto"
    >
      <div class="mb-3">
        <InputText
          v-model="modalCentro.busca"
          placeholder="Buscar (código, descrição...)"
          class="w-full"
          @input="onPesquisarCentroCusto"
        />
      </div>
      <DataTable
        :value="modalCentro.items"
        v-model:selection="modalCentro.selection"
        selectionMode="single"
        dataKey="CTT_CUSTO"
        :loading="modalCentro.loading"
        :paginator="true"
        :rows="modalCentro.perPage"
        :totalRecords="modalCentro.total"
        :lazy="true"
        :first="(modalCentro.page - 1) * modalCentro.perPage"
        @page="onCentroCustoPage"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
        :rowsPerPageOptions="[10, 20, 50]"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
        class="p-datatable-sm"
        responsiveLayout="scroll"
      >
        <Column field="CTT_CUSTO" header="Código" />
        <Column field="CTT_DESC01" header="Descrição" />
      </DataTable>
      <template #footer>
        <Button label="Cancelar" class="p-button-text" @click="fecharModalCentroCusto" />
        <Button label="Selecionar" class="p-button-success" @click="confirmarCentroCusto" :disabled="!modalCentro.selection" />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import SolicitacaoService from '@/service/SolicitacaoService';
import ProtheusService from '@/service/ProtheusService';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import ProgressSpinner from 'primevue/progressspinner';
import Dialog from 'primevue/dialog';

export default {
  name: 'AlterarCentroCustoSolicitacao',
  components: {
    Button,
    DataTable,
    Column,
    InputText,
    Message,
    Tag,
    Toast,
    ProgressSpinner,
    Dialog,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();
    const service = SolicitacaoService;
    const protheusService = new ProtheusService();

    const solicitacao = ref({
      id: null,
      numero: null,
      data: null,
      solicitante: null,
      status: null,
    });

    const itens = ref([]);
    const carregando = ref(false);
    const salvando = ref(false);
    const buscaCentroTimeout = ref(null);

    const modalCentro = reactive({
      visible: false,
      itemIndex: null,
      items: [],
      selection: null,
      loading: false,
      page: 1,
      perPage: 10,
      total: 0,
      busca: '',
    });

    const formatarQuantidade = (quantidade) => {
      if (!quantidade && quantidade !== 0) return '-';
      return parseInt(quantidade, 10).toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
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

    const centroCustoLabel = (centro) => {
      if (!centro) return '';
      const codigo = centro.CTT_CUSTO ?? centro.codigo ?? '';
      const descricao = centro.CTT_DESC01 ?? centro.descricao ?? '';
      if (codigo && descricao) return `${codigo} - ${descricao}`;
      return codigo || descricao || '';
    };

    const carregar = async () => {
      const id = route.params.id;
      if (!id) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'ID da solicitação não fornecido',
          life: 3000,
        });
        router.push({ name: 'solicitacoesList' });
        return;
      }

      try {
        carregando.value = true;
        const { data } = await service.show(id);
        const detalhe = data?.data ?? {};

        solicitacao.value = {
          id: detalhe.id,
          numero: detalhe.numero || null,
          data: detalhe.data || null,
          solicitante: detalhe.solicitante?.label ?? detalhe.solicitante ?? null,
          status: detalhe.status || null,
        };

        const itensCarregados = detalhe.itens || [];
        itens.value = itensCarregados.map((item) => ({
          id: item.id,
          codigo: item.codigo || null,
          referencia: item.referencia || null,
          mercadoria: item.mercadoria || '',
          quantidade: parseInt(item.quantidade, 10) || 0,
          unidade: item.unidade || null,
          aplicacao: item.aplicacao || null,
          prioridade: item.prioridade || null,
          tag: item.tag || null,
          centroCusto: item.centro_custo
            ? {
                CTT_CUSTO: item.centro_custo.codigo || item.centro_custo.CTT_CUSTO,
                CTT_DESC01: item.centro_custo.descricao || item.centro_custo.CTT_DESC01,
                CTT_CLASSE: item.centro_custo.classe || item.centro_custo.CTT_CLASSE,
                codigo: item.centro_custo.codigo || item.centro_custo.CTT_CUSTO,
                descricao: item.centro_custo.descricao || item.centro_custo.CTT_DESC01,
                classe: item.centro_custo.classe || item.centro_custo.CTT_CLASSE,
              }
            : null,
        }));
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro ao carregar',
          detail: error?.response?.data?.message || 'Não foi possível carregar os dados da solicitação.',
          life: 4000,
        });
        router.push({ name: 'solicitacoesList' });
      } finally {
        carregando.value = false;
      }
    };

    const fetchCentrosCusto = async () => {
      try {
        modalCentro.loading = true;
        const params = {
          page: modalCentro.page,
          per_page: modalCentro.perPage,
        };
        const busca = modalCentro.busca?.trim();
        if (busca) params.busca = busca;

        const response = await protheusService.getCentrosCusto(params);
        const payload = response?.data ?? {};
        const data = payload?.data ?? payload;
        modalCentro.items = data?.items ?? data?.centros ?? [];
        const pagination = data?.pagination ?? payload?.pagination ?? {};
        modalCentro.total = pagination?.total ?? data?.total ?? modalCentro.items.length;
        modalCentro.page = pagination?.current_page ?? params.page ?? 1;
        modalCentro.perPage = pagination?.per_page ?? params.per_page ?? modalCentro.perPage;
      } catch (err) {
        toast.add({
          severity: 'error',
          summary: 'Erro ao carregar centros de custo',
          detail: err?.response?.data?.message || 'Não foi possível obter os centros de custo.',
          life: 4000,
        });
        modalCentro.items = [];
      } finally {
        modalCentro.loading = false;
      }
    };

    const abrirModalCentroCusto = (index) => {
      modalCentro.itemIndex = index;
      modalCentro.visible = true;
      modalCentro.page = 1;
      modalCentro.busca = '';
      modalCentro.selection = itens.value[index]?.centroCusto ? { ...itens.value[index].centroCusto } : null;
      fetchCentrosCusto();
    };

    const fecharModalCentroCusto = () => {
      modalCentro.visible = false;
      modalCentro.itemIndex = null;
      modalCentro.selection = null;
    };

    const onPesquisarCentroCusto = () => {
      if (buscaCentroTimeout.value) clearTimeout(buscaCentroTimeout.value);
      buscaCentroTimeout.value = setTimeout(() => {
        modalCentro.page = 1;
        fetchCentrosCusto();
      }, 400);
    };

    const onCentroCustoPage = (event) => {
      modalCentro.page = event.page + 1;
      modalCentro.perPage = event.rows;
      fetchCentrosCusto();
    };

    const confirmarCentroCusto = () => {
      if (modalCentro.itemIndex == null || !modalCentro.selection) {
        fecharModalCentroCusto();
        return;
      }
      const sel = modalCentro.selection;
      itens.value[modalCentro.itemIndex].centroCusto = {
        CTT_CUSTO: sel.CTT_CUSTO ?? sel.codigo,
        CTT_DESC01: sel.CTT_DESC01 ?? sel.descricao,
        CTT_CLASSE: sel.CTT_CLASSE ?? sel.classe,
        codigo: sel.CTT_CUSTO ?? sel.codigo,
        descricao: sel.CTT_DESC01 ?? sel.descricao,
        classe: sel.CTT_CLASSE ?? sel.classe,
      };
      toast.add({
        severity: 'success',
        summary: 'Centro de custo selecionado',
        detail: centroCustoLabel(sel),
        life: 2000,
      });
      fecharModalCentroCusto();
    };

    const limparCentroCusto = (index) => {
      itens.value[index].centroCusto = null;
    };

    const salvar = async () => {
      const semCodigo = itens.value.filter((item) => !item.centroCusto || !(item.centroCusto.CTT_CUSTO ?? item.centroCusto.codigo));
      if (semCodigo.length > 0) {
        toast.add({
          severity: 'warn',
          summary: 'Validação',
          detail: 'Todos os itens devem ter um centro de custo selecionado.',
          life: 4000,
        });
        return;
      }

      try {
        salvando.value = true;
        const payload = {
          itens: itens.value.map((item) => {
            const c = item.centroCusto;
            const codigo = c.CTT_CUSTO ?? c.codigo ?? '';
            const descricao = c.CTT_DESC01 ?? c.descricao ?? null;
            const classe = c.CTT_CLASSE ?? c.classe ?? null;
            return {
              id: item.id,
              centro_custo: { codigo, descricao, classe },
            };
          }),
        };
        await service.alterarCentroCustoItens(solicitacao.value.id, payload);
        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Centros de custo dos itens alterados com sucesso.',
          life: 3000,
        });
        router.push({ name: 'solicitacoesList' });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro ao salvar',
          detail: error?.response?.data?.message || 'Não foi possível salvar as alterações.',
          life: 4000,
        });
      } finally {
        salvando.value = false;
      }
    };

    const voltar = () => {
      router.push({ name: 'solicitacoesList' }).catch(() => {
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
      modalCentro,
      formatarQuantidade,
      getSeverityStatus,
      getStyleStatus,
      centroCustoLabel,
      abrirModalCentroCusto,
      fecharModalCentroCusto,
      onPesquisarCentroCusto,
      onCentroCustoPage,
      confirmarCentroCusto,
      limparCentroCusto,
      salvar,
      voltar,
    };
  },
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

.centro-custo-input :deep(.p-inputtext) {
  min-width: 12rem;
}

.centro-custo-input :deep(.p-button) {
  flex-shrink: 0;
}
</style>
