<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Consulta de Ativo</h5>
      <div>
        <Button label="Editar" icon="pi pi-pencil" class="mr-2" @click="$router.push(`/ativos/${ativo?.id}`)" />
        <Button label="Transferir" icon="pi pi-send" class="mr-2" @click="abrirModalTransferir" />
        <Button label="Baixar" icon="pi pi-times" severity="danger" @click="abrirModalBaixar" />
      </div>
    </div>

    <div v-if="carregando" class="text-center p-5">
      <ProgressSpinner />
    </div>

    <div v-else-if="ativo" class="grid">
      <div class="col-12">
        <h6>Informações Gerais</h6>
        <div class="grid">
          <div class="col-12 md:col-4">
            <strong>Número:</strong> {{ ativo.asset_number }}
          </div>
          <div class="col-12 md:col-4">
            <strong>Data de Aquisição:</strong> {{ formatarData(ativo.acquisition_date) }}
          </div>
          <div class="col-12 md:col-4">
            <strong>Status:</strong> <Tag :value="ativo.status" :severity="getSeverityStatus(ativo.status)" />
          </div>
          <div class="col-12">
            <strong>Descrição:</strong> {{ ativo.description }}
          </div>
        </div>
      </div>

      <div class="col-12">
        <h6>Classificação</h6>
        <div class="grid">
          <div class="col-12 md:col-3">
            <strong>Filial:</strong> {{ ativo.branch?.name || '-' }}
          </div>
          <div class="col-12 md:col-3">
            <strong>Local:</strong> {{ ativo.location?.name || '-' }}
          </div>
          <div class="col-12 md:col-3">
            <strong>Responsável:</strong> {{ ativo.responsible?.nome_completo || '-' }}
          </div>
          <div class="col-12 md:col-3">
            <strong>Centro de Custo:</strong> {{ ativo.cost_center?.name || '-' }}
          </div>
        </div>
      </div>

      <div class="col-12">
        <h6>Valores</h6>
        <div class="grid">
          <div class="col-12 md:col-6">
            <strong>Valor (R$):</strong> {{ formatarValor(ativo.value_brl) }}
          </div>
          <div class="col-12 md:col-6" v-if="ativo.value_usd">
            <strong>Valor (US$):</strong> {{ formatarValorUSD(ativo.value_usd) }}
          </div>
        </div>
      </div>

      <div class="col-12">
        <h6>Histórico de Movimentações</h6>
        <DataTable :value="ativo.movements || []" :paginator="false" class="p-datatable-sm">
          <Column field="movement_date" header="Data">
            <template #body="slotProps">
              {{ formatarData(slotProps.data.movement_date) }}
            </template>
          </Column>
          <Column field="movement_type" header="Tipo">
            <template #body="slotProps">
              <Tag :value="slotProps.data.movement_type" />
            </template>
          </Column>
          <Column field="observation" header="Observação"></Column>
          <Column field="user.nome_completo" header="Usuário">
            <template #body="slotProps">
              {{ slotProps.data.user?.nome_completo || '-' }}
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <Dialog v-model:visible="modalTransferir" header="Transferir Ativo" :modal="true" :style="{ width: '500px' }">
      <div class="grid">
        <div class="col-12 md:col-6">
          <label>Filial Destino</label>
          <Dropdown v-model="formTransferir.to_branch_id" :options="filiais" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear />
        </div>
        <div class="col-12 md:col-6">
          <label>Local Destino</label>
          <Dropdown v-model="formTransferir.to_location_id" :options="locais" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear />
        </div>
        <div class="col-12 md:col-6">
          <label>Responsável Destino</label>
          <Dropdown v-model="formTransferir.to_responsible_id" :options="usuarios" optionLabel="nome_completo" optionValue="id" placeholder="Selecione" class="w-full" showClear />
        </div>
        <div class="col-12">
          <label>Observação</label>
          <Textarea v-model="formTransferir.observation" class="w-full" rows="3" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" class="p-button-outlined" @click="modalTransferir = false" />
        <Button label="Transferir" @click="transferirAtivo" :loading="processando" />
      </template>
    </Dialog>

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
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import AssetService from '@/service/AssetService';
import AssetAuxiliaryService from '@/service/AssetAuxiliaryService';
import AssetAuxiliaryService from '@/service/AssetAuxiliaryService';
import UserService from '@/service/UserService';

export default {
  name: 'AtivosDetalhes',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const service = new AssetService();

    const ativo = ref(null);
    const carregando = ref(false);
    const processando = ref(false);
    const modalTransferir = ref(false);
    const modalBaixar = ref(false);
    const filiais = ref([]);
    const locais = ref([]);
    const usuarios = ref([]);

    const formTransferir = ref({
      to_branch_id: null,
      to_location_id: null,
      to_responsible_id: null,
      observation: '',
    });

    const formBaixar = ref({
      reason: '',
      observation: '',
    });

    const formatarData = (data) => {
      if (!data) return '-';
      return new Date(data).toLocaleDateString('pt-BR');
    };

    const formatarValor = (valor) => {
      return valor ? parseFloat(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ 0,00';
    };

    const formatarValorUSD = (valor) => {
      return valor ? parseFloat(valor).toLocaleString('en-US', { style: 'currency', currency: 'USD' }) : '$0.00';
    };

    const getSeverityStatus = (status) => {
      const map = { incluido: 'success', baixado: 'danger', transferido: 'warning' };
      return map[status] || 'secondary';
    };

    const carregar = async () => {
      const id = route.query.id || route.params.id;
      if (!id) return;

      try {
        carregando.value = true;
        const { data } = await service.get(id);
        ativo.value = data.data || data;
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar ativo', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };

    const carregarAuxiliares = async () => {
      try {
        const [filiaisRes, locaisRes, usuariosRes] = await Promise.all([
          new AssetAuxiliaryService('filiais').getAll(),
          new AssetAuxiliaryService('locais').getAll(),
          new UserService().getAll(),
        ]);

        filiais.value = filiaisRes.data?.data || filiaisRes.data || [];
        locais.value = locaisRes.data?.data || locaisRes.data || [];
        usuarios.value = usuariosRes.data?.data || usuariosRes.data || [];
      } catch (error) {
        console.error('Erro ao carregar dados auxiliares:', error);
      }
    };

    const abrirModalTransferir = () => {
      formTransferir.value = {
        to_branch_id: ativo.value?.branch_id,
        to_location_id: ativo.value?.location_id,
        to_responsible_id: ativo.value?.responsible_id,
        observation: '',
      };
      modalTransferir.value = true;
    };

    const abrirModalBaixar = () => {
      formBaixar.value = { reason: '', observation: '' };
      modalBaixar.value = true;
    };

    const transferirAtivo = async () => {
      try {
        processando.value = true;
        await service.transferir(ativo.value.id, formTransferir.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Ativo transferido com sucesso', life: 3000 });
        modalTransferir.value = false;
        await carregar();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao transferir ativo', life: 3000 });
      } finally {
        processando.value = false;
      }
    };

    const baixarAtivo = async () => {
      if (!formBaixar.value.reason) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe o motivo da baixa', life: 3000 });
        return;
      }

      try {
        processando.value = true;
        await service.baixar(ativo.value.id, formBaixar.value);
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
      carregarAuxiliares();
    });

    return {
      ativo,
      carregando,
      processando,
      modalTransferir,
      modalBaixar,
      filiais,
      locais,
      usuarios,
      formTransferir,
      formBaixar,
      formatarData,
      formatarValor,
      formatarValorUSD,
      getSeverityStatus,
      abrirModalTransferir,
      abrirModalBaixar,
      transferirAtivo,
      baixarAtivo,
    };
  },
};
</script>

