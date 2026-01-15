<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Controle de Ativos</h5>
      <Button label="Novo Ativo" icon="pi pi-plus" @click="$router.push('/ativos/add')" />
    </div>

    <div class="grid mb-3">
      <div class="col-12 md:col-4">
        <label>Buscar</label>
        <InputText v-model="filtros.search" placeholder="Número, descrição, TAG..." class="w-full" />
      </div>
      <div class="col-12 md:col-3">
        <label>Filial</label>
        <Dropdown v-model="filtros.branch_id" :options="filiais" optionLabel="name" optionValue="id" placeholder="Todas" class="w-full" showClear />
      </div>
      <div class="col-12 md:col-3">
        <label>Status</label>
        <Dropdown v-model="filtros.status" :options="statusOptions" optionLabel="label" optionValue="value" placeholder="Todos" class="w-full" showClear />
      </div>
      <div class="col-12 md:col-2">
        <label>&nbsp;</label>
        <Button label="Filtrar" icon="pi pi-filter" class="w-full" @click="carregar" />
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
      <Column field="responsible.nome_completo" header="Responsável" sortable>
        <template #body="slotProps">
          {{ slotProps.data.responsible?.nome_completo || '-' }}
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
            icon="pi pi-eye"
            class="p-button-rounded p-button-text p-button-info mr-2"
            @click="$router.push(`/ativos/${slotProps.data.id}`)"
          />
          <Button
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text p-button-success mr-2"
            @click="$router.push(`/ativos/${slotProps.data.id}`)"
          />
          <Button
            v-if="slotProps.data.status !== 'baixado'"
            icon="pi pi-times"
            class="p-button-rounded p-button-text p-button-danger"
            @click="abrirModalBaixar(slotProps.data)"
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
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import AssetService from '@/service/AssetService';
import AssetAuxiliaryService from '@/service/AssetAuxiliaryService';

export default {
  name: 'AtivosList',
  setup() {
    const toast = useToast();
    const ativos = ref([]);
    const filiais = ref([]);
    const carregando = ref(false);
    const processando = ref(false);
    const modalBaixar = ref(false);
    const ativoSelecionado = ref(null);

    const service = new AssetService();
    const branchService = new AssetAuxiliaryService('filiais');

    const statusOptions = [
      { label: 'Incluído', value: 'incluido' },
      { label: 'Baixado', value: 'baixado' },
      { label: 'Transferido', value: 'transferido' },
    ];

    const filtros = ref({
      search: '',
      branch_id: null,
      status: null,
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

    onMounted(() => {
      carregar();
      carregarFiliais();
    });

    return {
      ativos,
      filiais,
      carregando,
      processando,
      modalBaixar,
      ativoSelecionado,
      statusOptions,
      filtros,
      formBaixar,
      formatarValor,
      getSeverityStatus,
      carregar,
      abrirModalBaixar,
      baixarAtivo,
    };
  },
};
</script>

