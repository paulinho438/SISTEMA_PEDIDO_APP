<template>
  <div class="card p-5 bg-page">
    <!-- Cabeçalho -->
    <div class="flex justify-content-between align-items-center mb-4">
      <div class="flex align-items-center">
        <Button icon="pi pi-arrow-left" class="p-button-text mr-2" @click="voltar" />
        <h4 class="m-0 text-900">Aprovar solicitação</h4>
        <span v-if="carregando" class="ml-3 text-600 text-sm">Carregando...</span>
        <Tag v-if="modoEdicaoHabilitado" value="Modo Edição" severity="info" class="ml-3" />
      </div>
      <div class="flex gap-2">
        <Button
            v-if="podeEditar && !modoEdicaoHabilitado"
            label="Habilitar modo de edição"
            icon="pi pi-pencil"
            class="p-button-outlined p-button-info"
            @click="habilitarModoEdicao"
        />
        <Button
            label="Imprimir PDF"
            icon="pi pi-print"
            class="p-button-info"
            :loading="imprimindo"
            :disabled="imprimindo || !solicitacao.id"
            @click="imprimirPDF"
        />
      </div>
    </div>

    <!-- Bloco Identificação -->
    <div class="card shadow-none bg-light p-4 mb-4">
      <h5 class="mb-3 text-900">Identificação da Solicitação</h5>

      <div class="grid text-sm">
        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Número da solicitação</label>
          <InputText v-if="modoEdicaoHabilitado" v-model="formEdit.numero" class="w-full" />
          <p v-else class="text-900 font-semibold">{{ solicitacao.numero }}</p>
        </div>

        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Data da Solicitação</label>
          <Calendar v-if="modoEdicaoHabilitado" v-model="formEdit.data" dateFormat="dd/mm/yy" class="w-full" />
          <p v-else class="text-900 font-semibold">{{ solicitacao.data }}</p>
        </div>

        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Empresa</label>
          <Dropdown
              v-if="modoEdicaoHabilitado"
              v-model="formEdit.empresa"
              :options="empresas"
              optionLabel="company"
              optionValue="id"
              placeholder="Selecione a empresa"
              class="w-full"
              :filter="true"
              :loading="carregandoEmpresas"
          />
          <p v-else class="text-900 font-semibold">{{ solicitacao.empresa }}</p>
        </div>

        <div class="col-12 md:col-3">
          <label class="text-600 block mb-1">Local</label>
          <InputText v-if="modoEdicaoHabilitado" v-model="formEdit.local" class="w-full" />
          <p v-else class="text-900 font-semibold">{{ solicitacao.local }}</p>
        </div>

        <div class="col-12 md:col-2">
          <label class="text-600 block mb-1">Solicitante</label>
          <Dropdown
              v-if="modoEdicaoHabilitado"
              v-model="formEdit.solicitante"
              :options="usuarios"
              optionLabel="nome_completo"
              optionValue="id"
              placeholder="Selecione o solicitante"
              class="w-full"
              :filter="true"
              :loading="carregandoUsuarios"
          />
          <p v-else class="text-900 font-semibold">{{ solicitacao.solicitante }}</p>
        </div>
      </div>

      <!-- Tabela de Itens -->
      <div class="mt-4">
        <div v-if="modoEdicaoHabilitado" class="flex justify-content-between align-items-center mb-2">
          <Button label="Adicionar item" icon="pi pi-plus" class="p-button-text p-button-success" @click="adicionarItem" />
        </div>
        <DataTable
            :value="tabelaItensEdit"
            class="p-datatable-sm tabela-aprovar mt-4"
            responsiveLayout="scroll"
        >
          <Column field="codigo" header="Código">
            <template #body="{ data }">
              <InputText v-if="modoEdicaoHabilitado" v-model="data.codigo" class="w-full p-inputtext-sm" />
              <span v-else>{{ data.codigo || '-' }}</span>
            </template>
          </Column>
          <Column field="referencia" header="Referência">
            <template #body="{ data }">
              <InputText v-if="modoEdicaoHabilitado" v-model="data.referencia" class="w-full p-inputtext-sm" />
              <span v-else>{{ data.referencia || '-' }}</span>
            </template>
          </Column>
          <Column field="mercadoria" header="Mercadoria">
            <template #body="{ data }">
              <InputText v-if="modoEdicaoHabilitado" v-model="data.mercadoria" class="w-full p-inputtext-sm" />
              <span v-else>{{ data.mercadoria || '-' }}</span>
            </template>
          </Column>
          <Column field="quantidade" header="Quant solicitada">
            <template #body="{ data }">
              <InputNumber v-if="modoEdicaoHabilitado" v-model="data.quantidade" class="w-full p-inputtext-sm" :min="0.0001" />
              <span v-else>{{ data.quantidade || '-' }}</span>
            </template>
          </Column>
          <Column field="unidade" header="Medida">
            <template #body="{ data }">
              <InputText v-if="modoEdicaoHabilitado" v-model="data.unidade" class="w-full p-inputtext-sm" />
              <span v-else>{{ data.unidade || '-' }}</span>
            </template>
          </Column>
          <Column field="aplicacao" header="Aplicação">
            <template #body="{ data }">
              <InputText v-if="modoEdicaoHabilitado" v-model="data.aplicacao" class="w-full p-inputtext-sm" />
              <span v-else>{{ data.aplicacao || '-' }}</span>
            </template>
          </Column>
          <Column field="prioridade" header="Prioridade dias">
            <template #body="{ data }">
              <InputNumber v-if="modoEdicaoHabilitado" v-model="data.prioridade" class="w-full p-inputtext-sm" :min="0" />
              <span v-else>{{ data.prioridade || '-' }}</span>
            </template>
          </Column>
          <Column field="tag" header="TAG">
            <template #body="{ data }">
              <InputText v-if="modoEdicaoHabilitado" v-model="data.tag" class="w-full p-inputtext-sm" />
              <span v-else>{{ data.tag || '-' }}</span>
            </template>
          </Column>
          <Column header="Centro de custo">
            <template #body="{ data }">
              <span>{{ formatarCentroCusto(data.centroCusto) }}</span>
            </template>
          </Column>
          <Column v-if="modoEdicaoHabilitado" header="" style="width:4rem; text-align:center">
            <template #body="{ data, index }">
              <Button icon="pi pi-trash" class="p-button-rounded p-button-text p-button-danger" @click="removerItem(index)" />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Observação -->
      <div class="mt-4">
        <label class="block text-600 mb-1">Observação</label>
        <Textarea v-if="modoEdicaoHabilitado" v-model="formEdit.observacao" rows="3" class="w-full" />
        <p v-else class="text-900">{{ solicitacao.observacao || '-' }}</p>
      </div>
    </div>

    <div class="card shadow-none bg-light p-4 mb-4">
      <label class="block text-600 mb-1">Justificativa / Motivo</label>
      <Textarea v-model="observacao" rows="3" class="w-full" placeholder="Informe a justificativa ou motivo da aprovação" />
    </div>

    <!-- Botões -->
    <div class="flex justify-content-end gap-2">
      <Button
          label="Reprovar"
          icon="pi pi-times"
          class="p-button-danger"
          :loading="salvando"
          :disabled="salvando"
          @click="abrirModalReprovar"
      />
      <Button
          label="Aprovar"
          icon="pi pi-check"
          class="p-button-success"
          :loading="salvando"
          :disabled="salvando"
          @click="aprovar"
      />
    </div>

    <Toast />

    <!-- Modal de Reprovação -->
    <Dialog
        v-model:visible="modalReprovar"
        header="Confirmar Reprovação"
        :style="{ width: '500px' }"
        :modal="true"
        :closable="true"
    >
      <div class="flex flex-column gap-3">
        <p class="text-700 m-0">
          Informe o motivo da reprovação. Esta mensagem será visível para o solicitante ao editar a solicitação.
        </p>
        
        <div>
          <label class="block text-600 mb-2 font-medium">Motivo da Reprovação *</label>
          <Textarea
              v-model="mensagemReprovacao"
              rows="5"
              class="w-full"
              placeholder="Descreva o motivo da reprovação..."
              :disabled="salvando"
          />
          <small v-if="!mensagemReprovacao.trim() && tentouConfirmar" class="text-red-500 block mt-1">
            O motivo da reprovação é obrigatório.
          </small>
        </div>
      </div>

      <template #footer>
        <Button
            label="Cancelar"
            icon="pi pi-times"
            class="p-button-text"
            :disabled="salvando"
            @click="fecharModalReprovar"
        />
        <Button
            label="Confirmar Reprovação"
            icon="pi pi-check"
            class="p-button-danger"
            :loading="salvando"
            :disabled="salvando"
            @click="confirmarReprovar"
        />
      </template>
    </Dialog>
  </div>
</template>

<script>
import { reactive, ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import SolicitacaoService from '@/service/SolicitacaoService';
import EmpresaService from '@/service/EmpresaService';
import UsuarioService from '@/service/UsuarioService';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Tag from 'primevue/tag';

export default {
  name: 'AprovarSolicitacao',
  components: {
    InputText,
    Textarea,
    Calendar,
    Dropdown,
    InputNumber,
    Tag,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();
    const store = useStore();

    const solicitacao = reactive({
      id: null,
      numero: '',
      data: '',
      empresa: '',
      local: '',
      solicitante: '',
      observacao: '',
      items: [],
      status: null,
      empresaObj: null,
      solicitanteObj: null,
    });

    const formEdit = reactive({
      numero: '',
      data: null,
      empresa: null,
      local: '',
      solicitante: null,
      observacao: '',
    });

    const carregando = ref(false);
    const salvando = ref(false);
    const observacao = ref('');
    const modalReprovar = ref(false);
    const mensagemReprovacao = ref('');
    const tentouConfirmar = ref(false);
    const imprimindo = ref(false);
    const empresas = ref([]);
    const usuarios = ref([]);
    const carregandoEmpresas = ref(false);
    const carregandoUsuarios = ref(false);
    const itensEdit = ref([]);
    const modoEdicaoHabilitado = ref(false);

    // Verificar permissão de edição
    const podeEditar = computed(() => {
      const permissions = store.getters?.permissions || [];
      return permissions.includes('edit_cotacoes_aprovacao');
    });

    const habilitarModoEdicao = async () => {
      modoEdicaoHabilitado.value = true;
      
      // Carregar dados necessários para edição se ainda não foram carregados
      if (empresas.value.length === 0 || usuarios.value.length === 0) {
        await Promise.all([carregarEmpresas(), carregarUsuarios()]);
      }
      
      // Inicializar formEdit se ainda não foi inicializado
      if (!formEdit.numero) {
        formEdit.numero = solicitacao.numero || '';
        
        // Converter data
        if (solicitacao.data && typeof solicitacao.data === 'string') {
          const partes = solicitacao.data.split('/');
          if (partes.length === 3) {
            const [dia, mes, ano] = partes;
            formEdit.data = new Date(`${ano}-${mes}-${dia}`);
          } else {
            formEdit.data = new Date(solicitacao.data);
          }
        } else {
          formEdit.data = new Date();
        }
        
        formEdit.empresa = solicitacao.empresaObj?.id || null;
        formEdit.local = solicitacao.local || '';
        formEdit.solicitante = solicitacao.solicitanteObj?.id || null;
        formEdit.observacao = solicitacao.observacao || '';
        
        // Carregar itens editáveis
        itensEdit.value = solicitacao.items.map(item => ({
          id: item.id,
          codigo: item.codigo || '',
          referencia: item.referencia || '',
          mercadoria: item.mercadoria || '',
          quantidade: item.quantidade || 0,
          unidade: item.unidade || '',
          aplicacao: item.aplicacao || '',
          prioridade: item.prioridade || null,
          tag: item.tag || '',
          centroCusto: item.centro_custo,
        }));
      }
    };

    const formatarCentroCusto = (centroCusto) => {
      if (!centroCusto) return '-';
      
      if (typeof centroCusto === 'string') {
        return centroCusto;
      }
      
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

    const tabelaItensEdit = computed(() => {
      if (modoEdicaoHabilitado.value) {
        return itensEdit.value;
      }
      return solicitacao.items.map((item) => ({
        id: item.id,
        codigo: item.codigo,
        referencia: item.referencia,
        mercadoria: item.mercadoria,
        quantidade: item.quantidade,
        unidade: item.unidade,
        aplicacao: item.aplicacao,
        prioridade: item.prioridade,
        tag: item.tag,
        centroCusto: item.centro_custo,
      }));
    });

    const carregarEmpresas = async () => {
      try {
        carregandoEmpresas.value = true;
        const empresaService = new EmpresaService();
        const { data } = await empresaService.getAll();
        empresas.value = Array.isArray(data) ? data : (data?.data || []);
      } catch (error) {
        console.error('Erro ao carregar empresas', error);
      } finally {
        carregandoEmpresas.value = false;
      }
    };

    const carregarUsuarios = async () => {
      try {
        carregandoUsuarios.value = true;
        const usuarioService = new UsuarioService();
        const { data } = await usuarioService.getAll();
        usuarios.value = Array.isArray(data) ? data : (data?.data || []);
      } catch (error) {
        console.error('Erro ao carregar usuários', error);
      } finally {
        carregandoUsuarios.value = false;
      }
    };

    const carregarDados = async () => {
      try {
        carregando.value = true;
        const { data } = await SolicitacaoService.show(route.params.id);
        const detalhe = data?.data ?? {};

        solicitacao.id = detalhe.id;
        solicitacao.numero = detalhe.numero;
        solicitacao.data = detalhe.data;
        solicitacao.empresa = typeof detalhe.empresa === 'object' ? detalhe.empresa?.label || '-' : detalhe.empresa || '-';
        solicitacao.empresaObj = typeof detalhe.empresa === 'object' ? detalhe.empresa : null;
        solicitacao.local = detalhe.local;
        solicitacao.solicitante = detalhe.solicitante || detalhe.requester;
        solicitacao.solicitanteObj = typeof detalhe.solicitante === 'object' ? detalhe.solicitante : null;
        solicitacao.observacao = detalhe.observacao;
        solicitacao.items = detalhe.itens || [];
        solicitacao.status = detalhe.status;

        // Não preencher formEdit automaticamente - só será preenchido quando habilitar modo de edição

        const slugAtual = detalhe.status?.slug;
        const statusPermitidos = ['aguardando', 'analisada', 'analisada_aguardando', 'analise_gerencia'];

        if (slugAtual && !statusPermitidos.includes(slugAtual)) {
          toast.add({
            severity: 'info',
            summary: 'Solicitação redirecionada',
            detail: 'O fluxo atual dessa solicitação é tratado em outra tela.',
            life: 3000,
          });
          const destino = slugAtual === 'autorizado' ? 'vincularSolicitacao' : 'solicitacoesPendentes';
          router.push({ name: destino, params: { id: detalhe.id } });
          return;
        }
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível carregar a solicitação.';
        toast.add({ severity: 'error', summary: 'Erro', detail, life: 4000 });
        router.push({ name: 'solicitacoesPendentes' });
      } finally {
        carregando.value = false;
      }
    };

    const adicionarItem = () => {
      itensEdit.value.push({
        id: null,
        codigo: '',
        referencia: '',
        mercadoria: '',
        quantidade: 0,
        unidade: '',
        aplicacao: '',
        prioridade: null,
        tag: '',
        centroCusto: null,
      });
    };

    const removerItem = (index) => {
      itensEdit.value.splice(index, 1);
    };

    const voltar = () => router.push({ name: 'solicitacoesPendentes' });

    const aprovar = async () => {
      try {
        salvando.value = true;
        
        const payload = {
          observacao: observacao.value,
        };
        
        // Se modo de edição está habilitado, incluir dados de edição
        if (modoEdicaoHabilitado.value) {
          // Formatar data
          let dataFormatada = null;
          if (formEdit.data) {
            const data = new Date(formEdit.data);
            const dia = String(data.getDate()).padStart(2, '0');
            const mes = String(data.getMonth() + 1).padStart(2, '0');
            const ano = data.getFullYear();
            dataFormatada = `${dia}/${mes}/${ano}`;
          }
          
          payload.numero = formEdit.numero || null;
          payload.data_solicitacao = dataFormatada;
          
          // Buscar empresa e solicitante selecionados para enviar id e label
          if (formEdit.empresa) {
            const empresaSelecionada = empresas.value.find(e => e.id === formEdit.empresa);
            payload.empresa = empresaSelecionada ? {
              id: empresaSelecionada.id,
              label: empresaSelecionada.company || empresaSelecionada.name || ''
            } : null;
          } else {
            payload.empresa = null;
          }
          
          if (formEdit.solicitante) {
            const usuarioSelecionado = usuarios.value.find(u => u.id === formEdit.solicitante);
            payload.solicitante = usuarioSelecionado ? {
              id: usuarioSelecionado.id,
              label: usuarioSelecionado.nome_completo || usuarioSelecionado.name || ''
            } : null;
          } else {
            payload.solicitante = null;
          }
          
          payload.local = formEdit.local || null;
          payload.observacao = formEdit.observacao || null;
          
          // Formatar itens
          payload.itens = itensEdit.value.map(item => ({
            id: item.id || null,
            codigo: item.codigo || null,
            referencia: item.referencia || null,
            mercadoria: item.mercadoria || '',
            quantidade: item.quantidade || 0,
            unidade: item.unidade || null,
            aplicacao: item.aplicacao || null,
            prioridade: item.prioridade || null,
            tag: item.tag || null,
            centro_custo: item.centroCusto ? {
              codigo: item.centroCusto.codigo || item.centroCusto.CTT_CUSTO,
              descricao: item.centroCusto.descricao || item.centroCusto.CTT_DESC01,
              classe: item.centroCusto.classe || item.centroCusto.CTT_CLASSE,
            } : null,
          }));
        }
        
        await SolicitacaoService.approve(solicitacao.id, payload);
        toast.add({ severity: 'success', summary: 'Solicitação aprovada', detail: `${solicitacao.numero} aprovada com sucesso!`, life: 3000 });
        router.push({ name: 'solicitacoesPendentes' });
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível aprovar a solicitação.';
        toast.add({ severity: 'error', summary: 'Erro ao aprovar', detail, life: 4000 });
      } finally {
        salvando.value = false;
      }
    };

    const abrirModalReprovar = () => {
      mensagemReprovacao.value = '';
      tentouConfirmar.value = false;
      modalReprovar.value = true;
    };

    const fecharModalReprovar = () => {
      modalReprovar.value = false;
      mensagemReprovacao.value = '';
      tentouConfirmar.value = false;
    };

    const imprimirPDF = async () => {
      try {
        imprimindo.value = true;
        const response = await SolicitacaoService.imprimir(route.params.id, 'solicitacao');
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível imprimir a solicitação.';
        toast.add({ severity: 'error', summary: 'Erro ao imprimir', detail, life: 4000 });
      } finally {
        imprimindo.value = false;
      }
    };

    const confirmarReprovar = async () => {
      tentouConfirmar.value = true;

      if (!mensagemReprovacao.value.trim()) {
        toast.add({
          severity: 'warn',
          summary: 'Campo obrigatório',
          detail: 'Informe o motivo da reprovação.',
          life: 3000,
        });
        return;
      }

      try {
        salvando.value = true;
        await SolicitacaoService.reject(solicitacao.id, {
          mensagem: mensagemReprovacao.value.trim(),
          observacao: mensagemReprovacao.value.trim(),
        });
        toast.add({
          severity: 'warn',
          summary: 'Solicitação reprovada',
          detail: `${solicitacao.numero} foi reprovada. O solicitante poderá editar a solicitação.`,
          life: 4000,
        });
        fecharModalReprovar();
        router.push({ name: 'solicitacoesPendentes' });
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível reprovar a solicitação.';
        toast.add({ severity: 'error', summary: 'Erro ao reprovar', detail, life: 4000 });
      } finally {
        salvando.value = false;
      }
    };

    onMounted(async () => {
      await carregarDados();
    });

    return {
      solicitacao,
      formEdit,
      tabelaItensEdit,
      formatarCentroCusto,
      voltar,
      aprovar,
      reprovar: abrirModalReprovar,
      abrirModalReprovar,
      fecharModalReprovar,
      confirmarReprovar,
      carregando,
      salvando,
      observacao,
      modalReprovar,
      mensagemReprovacao,
      tentouConfirmar,
      imprimirPDF,
      imprimindo,
      podeEditar,
      empresas,
      usuarios,
      carregandoEmpresas,
      carregandoUsuarios,
      adicionarItem,
      removerItem,
      modoEdicaoHabilitado,
      habilitarModoEdicao,
    };
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
