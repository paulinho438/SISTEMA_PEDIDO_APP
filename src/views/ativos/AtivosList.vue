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
        <InputText v-model="filtros.search" placeholder="Número, descrição, TAG..." class="w-full" />
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
        <Button label="Filtrar" icon="pi pi-filter" class="w-full" @click="carregar" />
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
      :rows="10"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
    >
      <Column field="asset_number" header="Número" sortable></Column>
      <Column field="description" header="Descrição" sortable></Column>
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

export default {
  name: 'AtivosList',
  setup() {
    const toast = useToast();
    const permissionService = new PermissionsService();
    const ativos = ref([]);
    const filiais = ref([]);
    const responsaveis = ref([]);
    const carregando = ref(false);
    const processando = ref(false);
    const gerandoTermo = ref(false);
    const modalBaixar = ref(false);
    const ativoSelecionado = ref(null);

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
        const params = { ...filtros.value, per_page: 100 };
        const { data } = await service.getAll(params);
        ativos.value = data.data || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar ativos', life: 3000 });
      } finally {
        carregando.value = false;
      }
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
    };
  },
};
</script>

