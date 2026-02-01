<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Controle de Ativos</h5>
      <Button 
        v-if="podeCriar"
        label="Novo Ativo" 
        icon="pi pi-plus" 
        @click="$router.push('/ativos/add')" 
      />
    </div>

    <div class="grid mb-3">
      <div class="col-12 md:col-3">
        <label>Buscar</label>
        <InputText v-model="filtros.search" placeholder="Número, descrição, TAG..." class="w-full" @input="onSearchChange" />
      </div>
      <div class="col-12 md:col-2">
        <label>Filial</label>
        <Dropdown v-model="filtros.branch_id" :options="filiais" optionLabel="name" optionValue="id" placeholder="Todas" class="w-full" showClear />
      </div>
      <div class="col-12 md:col-2">
        <label>Status</label>
        <Dropdown v-model="filtros.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" showClear />
      </div>
      <div class="col-12 md:col-3">
        <label>Responsável</label>
        <Dropdown v-model="filtros.responsible_id" :options="responsaveis" optionLabel="name" optionValue="id" placeholder="Todos" class="w-full" showClear :filter="true" filterPlaceholder="Buscar responsável" />
      </div>
      <div class="col-12 md:col-2">
        <label>&nbsp;</label>
        <Button label="Filtrar" icon="pi pi-filter" class="w-full" @click="aplicarFiltros" />
      </div>
      <div class="col-12 md:col-2">
        <label>&nbsp;</label>
        <Button 
          label="Gerar Termo" 
          icon="pi pi-file-pdf" 
          class="w-full p-button-success" 
          :disabled="!filtros.responsible_id"
          @click="gerarTermoResponsabilidade"
          :loading="gerandoTermo"
        />
      </div>
    </div>

    <DataTable
      :value="ativos"
      :paginator="true"
      :rows="paginacao.perPage"
      :totalRecords="paginacao.total"
      :lazy="true"
      :first="(paginacao.page - 1) * paginacao.perPage"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
      @page="onPageChange"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} ativos"
    >
      <Column field="asset_number" header="Número" sortable></Column>
      <Column field="standard_description.name" header="Descrição" sortable>
        <template #body="slotProps">
          {{ slotProps.data.standard_description?.name || '-' }}
        </template>
      </Column>
      <Column field="brand" header="Marca" sortable>
        <template #body="slotProps">
          {{ slotProps.data.brand || '-' }}
        </template>
      </Column>
      <Column field="model" header="Modelo" sortable>
        <template #body="slotProps">
          {{ slotProps.data.model || '-' }}
        </template>
      </Column>
      <Column field="branch.name" header="Filial" sortable>
        <template #body="slotProps">
          {{ slotProps.data.branch?.name || '-' }}
        </template>
      </Column>
      <Column field="location.name" header="Local" sortable>
        <template #body="slotProps">
          {{ slotProps.data.location?.name || '-' }}
        </template>
      </Column>
      <Column field="responsible.name" header="Responsável" sortable>
        <template #body="slotProps">
          {{ slotProps.data.responsible?.name || '-' }}
        </template>
      </Column>
      <Column field="status" header="Status" sortable>
        <template #body="slotProps">
          <Tag :value="slotProps.data.status" :severity="getSeverityStatus(slotProps.data.status)" />
        </template>
      </Column>
      <Column field="value_brl" header="Valor" sortable>
        <template #body="slotProps">
          {{ formatarValor(slotProps.data.value_brl) }}
        </template>
      </Column>
      <Column header="Ações">
        <template #body="slotProps">
          <Button
            v-if="podeVisualizar"
            icon="pi pi-eye"
            class="p-button-rounded p-button-text p-button-info mr-2"
            @click="$router.push(`/ativos/${slotProps.data.id}?view=true`)"
            v-tooltip.top="'Visualizar'"
          />
          <Button
            v-if="podeEditar"
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text p-button-success mr-2"
            @click="$router.push(`/ativos/${slotProps.data.id}`)"
            v-tooltip.top="'Editar'"
          />
          <Button
            v-if="podeDeletar && slotProps.data.status !== 'baixado'"
            icon="pi pi-times"
            class="p-button-rounded p-button-text p-button-danger"
            @click="abrirModalBaixar(slotProps.data)"
            v-tooltip.top="'Baixar'"
          />
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="modalBaixar" header="Baixar Ativo" :modal="true" :style="{ width: '400px' }">
      <div class="grid">
        <div class="col-12">
          <label>Motivo *</label>
          <InputText v-model="formBaixar.reason" class="w-full" required />
        </div>
        <div class="col-12">
          <label>Observação</label>
          <Textarea v-model="formBaixar.observation" class="w-full" rows="3" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" class="p-button-outlined" @click="modalBaixar = false" />
        <Button label="Baixar" @click="baixarAtivo" :loading="processando" />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import PermissionsService from '@/service/PermissionsService';
import AssetService from '@/service/AssetService';
import AssetAuxiliaryService from '@/service/AssetAuxiliaryService';
import { usePaginationPersist } from '@/composables/usePaginationPersist';

export default {
  name: 'AtivosList',
  setup() {
    const toast = useToast();
    const permissionService = new PermissionsService();
    const { getInitialPagination, savePagination } = usePaginationPersist('ativos', 10);
    const saved = getInitialPagination();
    const ativos = ref([]);
    const filiais = ref([]);
    const responsaveis = ref([]);
    const carregando = ref(false);
    const processando = ref(false);
    const gerandoTermo = ref(false);
    const modalBaixar = ref(false);
    const ativoSelecionado = ref(null);
    const searchTimeout = ref(null);
    
    const paginacao = ref({
      page: saved.page,
      perPage: saved.rows,
      total: 0,
      lastPage: 1
    });

    const service = new AssetService();
    const branchService = new AssetAuxiliaryService('filiais');
    const responsaveisService = new AssetAuxiliaryService('responsaveis');

    // Verificar permissões
    const podeCriar = computed(() => permissionService.hasPermissions('view_ativos_create'));
    const podeVisualizar = computed(() => permissionService.hasPermissions('view_ativos'));
    const podeEditar = computed(() => permissionService.hasPermissions('view_ativos_edit'));
    const podeDeletar = computed(() => permissionService.hasPermissions('view_ativos_delete'));

    const statusOptions = [
      { label: 'Incluído', value: 'incluido' },
      { label: 'Baixado', value: 'baixado' },
      { label: 'Transferido', value: 'transferido' },
    ];

    const filtros = ref({
      search: '',
      branch_id: null,
      status: null,
      responsible_id: null,
    });

    const formBaixar = ref({
      reason: '',
      observation: '',
    });

    const formatarValor = (valor) => {
      return valor ? parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
    };

    const getSeverityStatus = (status) => {
      const map = {
        incluido: 'success',
        baixado: 'danger',
        transferido: 'warning',
      };
      return map[status] || 'secondary';
    };

    const carregar = async () => {
      try {
        carregando.value = true;
        const params = {
          ...filtros.value,
          page: paginacao.value.page,
          per_page: paginacao.value.perPage
        };
        
        // Remover campos vazios/null dos filtros
        Object.keys(params).forEach(key => {
          if (params[key] === null || params[key] === '' || params[key] === undefined) {
            delete params[key];
          }
        });
        
        const { data } = await service.getAll(params);
        
        // Laravel Resource::collection com paginate retorna:
        // { data: [...], current_page, per_page, total, last_page, etc }
        ativos.value = data.data || [];
        
        // Atualizar informações de paginação
        paginacao.value.total = data.total || 0;
        paginacao.value.page = data.current_page || 1;
        paginacao.value.perPage = data.per_page || 10;
        paginacao.value.lastPage = data.last_page || 1;
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar ativos', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };
    
    const onPageChange = (event) => {
      const newPage = event.page + 1; // PrimeVue usa índice 0, Laravel usa 1
      const newRows = event.rows;
      savePagination(newRows, newPage);
      paginacao.value.page = newPage;
      paginacao.value.perPage = newRows;
      carregar();
    };
    
    const onSearchChange = () => {
      // Debounce: aguardar 500ms após o usuário parar de digitar
      if (searchTimeout.value) {
        clearTimeout(searchTimeout.value);
      }
      
      searchTimeout.value = setTimeout(() => {
        paginacao.value.page = 1; // Resetar para primeira página ao buscar
        carregar();
      }, 500);
    };
    
    const aplicarFiltros = () => {
      paginacao.value.page = 1; // Resetar para primeira página ao aplicar filtros
      carregar();
    };

    const carregarFiliais = async () => {
      try {
        const { data } = await branchService.getAll();
        filiais.value = data.data || data || [];
      } catch (error) {
        console.error('Erro ao carregar filiais:', error);
      }
    };

    const carregarResponsaveis = async () => {
      try {
        const { data } = await responsaveisService.getAll({ all: true });
        responsaveis.value = data?.data || data || [];
      } catch (error) {
        console.error('Erro ao carregar responsáveis:', error);
      }
    };

    const abrirModalBaixar = (ativo) => {
      ativoSelecionado.value = ativo;
      formBaixar.value = { reason: '', observation: '' };
      modalBaixar.value = true;
    };

    const baixarAtivo = async () => {
      if (!formBaixar.value.reason) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe o motivo da baixa', life: 3000 });
        return;
      }

      try {
        processando.value = true;
        await service.baixar(ativoSelecionado.value.id, formBaixar.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Ativo baixado com sucesso', life: 3000 });
        modalBaixar.value = false;
        await carregar();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao baixar ativo', life: 3000 });
      } finally {
        processando.value = false;
      }
    };

    const gerarTermoResponsabilidade = async () => {
      if (!filtros.value.responsible_id) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um responsável para gerar o termo', life: 3000 });
        return;
      }

      try {
        gerandoTermo.value = true;
        const responsavel = responsaveis.value.find(r => r.id === filtros.value.responsible_id);
        const responsavelNome = responsavel?.name || 'termo';

        const response = await service.gerarTermoResponsabilidade(filtros.value.responsible_id);
        
        // Criar link temporário para download
        const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `termo-responsabilidade-${responsavelNome}-${new Date().toISOString().split('T')[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Termo de responsabilidade gerado com sucesso!', life: 3000 });
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao gerar termo de responsabilidade', life: 3000 });
      } finally {
        gerandoTermo.value = false;
      }
    };

    onMounted(() => {
      carregar();
      carregarFiliais();
      carregarResponsaveis();
    });

    return {
      ativos,
      filiais,
      responsaveis,
      carregando,
      processando,
      modalBaixar,
      ativoSelecionado,
      statusOptions,
      filtros,
      formBaixar,
      paginacao,
      podeCriar,
      podeVisualizar,
      podeEditar,
      podeDeletar,
      formatarValor,
      getSeverityStatus,
      carregar,
      abrirModalBaixar,
      baixarAtivo,
      gerarTermoResponsabilidade,
      gerandoTermo,
      onPageChange,
      onSearchChange,
      aplicarFiltros,
    };
  },
};
</script>

