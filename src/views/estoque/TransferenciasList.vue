<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 m-0">Controle de Transferências</h5>
    </div>

    <div class="grid mb-3">
      <div class="col-12 md:col-3">
        <label for="status">Status</label>
        <Dropdown
          id="status"
          v-model="filtros.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos"
          class="w-full"
          showClear
        />
      </div>
      <div class="col-12 md:col-3">
        <label for="localOrigem">Local de Origem</label>
        <Dropdown
          id="localOrigem"
          v-model="filtros.local_origem_id"
          :options="locais"
          optionLabel="name"
          optionValue="id"
          placeholder="Todos"
          class="w-full"
          :filter="true"
          showClear
        />
      </div>
      <div class="col-12 md:col-3">
        <label for="localDestino">Local de Destino</label>
        <Dropdown
          id="localDestino"
          v-model="filtros.local_destino_id"
          :options="locais"
          optionLabel="name"
          optionValue="id"
          placeholder="Todos"
          class="w-full"
          :filter="true"
          showClear
        />
      </div>
      <div class="col-12 md:col-3">
        <label>&nbsp;</label>
        <Button label="Filtrar" icon="pi pi-filter" class="w-full mt-2" @click="carregar" />
      </div>
    </div>

    <DataTable
      :value="transferencias"
      :paginator="true"
      :rows="10"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
    >
      <Column field="transfer_number" header="Número" sortable></Column>
      <Column field="origin_location.name" header="Origem" sortable>
        <template #body="slotProps">
          {{ slotProps.data.origin_location?.name || '-' }}
        </template>
      </Column>
      <Column field="destination_location.name" header="Destino" sortable>
        <template #body="slotProps">
          {{ slotProps.data.destination_location?.name || '-' }}
        </template>
      </Column>
      <Column field="driver_name" header="Motorista" sortable>
        <template #body="slotProps">
          {{ slotProps.data.driver_name || '-' }}
        </template>
      </Column>
      <Column field="license_plate" header="Placa" sortable>
        <template #body="slotProps">
          {{ slotProps.data.license_plate || '-' }}
        </template>
      </Column>
      <Column field="status" header="Status" sortable>
        <template #body="slotProps">
          <Tag 
            :value="slotProps.data.status_label" 
            :severity="slotProps.data.status === 'pendente' ? 'warning' : 'success'" 
          />
        </template>
      </Column>
      <Column field="items_count" header="Itens" sortable>
        <template #body="slotProps">
          {{ slotProps.data.items_count || 0 }}
        </template>
      </Column>
      <Column field="total_quantity" header="Qtd. Total" sortable>
        <template #body="slotProps">
          {{ formatarQuantidade(slotProps.data.total_quantity) }}
        </template>
      </Column>
      <Column field="created_at" header="Data" sortable>
        <template #body="slotProps">
          {{ formatarData(slotProps.data.created_at) }}
        </template>
      </Column>
      <Column header="Ações" :exportable="false">
        <template #body="slotProps">
          <div class="flex gap-1">
            <Button
              icon="pi pi-file-pdf"
              class="p-button-rounded p-button-text p-button-info p-button-sm"
              v-tooltip.top="'Imprimir Documento'"
              @click="imprimirDocumento(slotProps.data.id)"
            />
            <Button
              v-if="slotProps.data.status === 'pendente'"
              icon="pi pi-check"
              class="p-button-rounded p-button-text p-button-success p-button-sm"
              v-tooltip.top="'Marcar como Recebido'"
              @click="marcarRecebido(slotProps.data.id)"
              :loading="processando === slotProps.data.id"
            />
            <Button
              v-if="slotProps.data.status === 'pendente'"
              icon="pi pi-trash"
              class="p-button-rounded p-button-text p-button-danger p-button-sm"
              v-tooltip.top="'Excluir Transferência'"
              @click="confirmarExclusao(slotProps.data.id)"
              :loading="processando === slotProps.data.id"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import StockTransferService from '@/service/StockTransferService';
import StockLocationService from '@/service/StockLocationService';
import PermissionsService from '@/service/PermissionsService';

export default {
  name: 'TransferenciasList',
  setup() {
    const toast = useToast();
    const confirm = useConfirm();
    const transferService = new StockTransferService();
    const locationService = new StockLocationService();
    const permissionsService = new PermissionsService();

    const transferencias = ref([]);
    const locais = ref([]);
    const carregando = ref(false);
    const processando = ref(null);

    const filtros = ref({
      status: null,
      local_origem_id: null,
      local_destino_id: null,
    });

    const statusOptions = [
      { label: 'Pendente', value: 'pendente' },
      { label: 'Recebido', value: 'recebido' },
    ];

    const carregarLocais = async () => {
      try {
        const { data } = await locationService.getAll({ per_page: 100 });
        locais.value = data.data || [];
      } catch (error) {
        console.error('Erro ao carregar locais:', error);
      }
    };

    const carregar = async () => {
      carregando.value = true;
      try {
        const params = {};
        if (filtros.value.status) params.status = filtros.value.status;
        if (filtros.value.local_origem_id) params.local_origem_id = filtros.value.local_origem_id;
        if (filtros.value.local_destino_id) params.local_destino_id = filtros.value.local_destino_id;

        const { data } = await transferService.getAll(params);
        transferencias.value = data.data || [];
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar transferências',
          life: 3000
        });
      } finally {
        carregando.value = false;
      }
    };

    const marcarRecebido = async (id) => {
      processando.value = id;
      try {
        await transferService.receber(id);
        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Transferência marcada como recebida',
          life: 3000
        });
        await carregar();
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.error || 'Erro ao marcar como recebido',
          life: 3000
        });
      } finally {
        processando.value = null;
      }
    };

    const confirmarExclusao = (id) => {
      confirm.require({
        message: 'Tem certeza que deseja excluir esta transferência? Os materiais serão devolvidos ao estoque de origem.',
        header: 'Confirmar Exclusão',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          excluir(id);
        }
      });
    };

    const excluir = async (id) => {
      processando.value = id;
      try {
        await transferService.excluir(id);
        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Transferência excluída com sucesso',
          life: 3000
        });
        await carregar();
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.error || 'Erro ao excluir transferência',
          life: 3000
        });
      } finally {
        processando.value = null;
      }
    };

    const imprimirDocumento = async (id) => {
      try {
        const response = await transferService.gerarDocumento(id);
        
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `transferencia-${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Documento gerado com sucesso!',
          life: 3000
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao gerar documento',
          life: 3000
        });
      }
    };

    const formatarQuantidade = (qtd) => {
      if (!qtd) return '0,00';
      return parseFloat(qtd).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      });
    };

    const formatarData = (data) => {
      if (!data) return '-';
      return data;
    };

    onMounted(() => {
      carregarLocais();
      carregar();
    });

    return {
      transferencias,
      locais,
      carregando,
      processando,
      filtros,
      statusOptions,
      carregar,
      marcarRecebido,
      confirmarExclusao,
      excluir,
      imprimirDocumento,
      formatarQuantidade,
      formatarData,
    };
  },
};
</script>

