<template>
  <div class="card p-5 bg-page">
    <h5 class="text-900 mb-3">{{ id ? 'Editar' : 'Novo' }} Ativo</h5>

    <form @submit.prevent="salvar">
      <TabView>
        <TabPanel header="Informações Gerais">
          <div class="grid">
            <div class="col-12 md:col-6">
              <label>Número do Ativo</label>
              <InputText v-model="form.asset_number" class="w-full" :disabled="!!id" />
            </div>
            <div class="col-12 md:col-6">
              <label>Data de Aquisição *</label>
              <Calendar v-model="form.acquisition_date" dateFormat="yy-mm-dd" class="w-full" :showIcon="true" />
            </div>
            <div class="col-12 md:col-6">
              <label>Descrição Padrão</label>
              <Dropdown v-model="form.standard_description_id" :options="descricoesPadrao" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear />
            </div>
            <div class="col-12 md:col-6">
              <label>Status</label>
              <Dropdown v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" />
            </div>
            <div class="col-12">
              <label>Descrição *</label>
              <Textarea v-model="form.description" class="w-full" rows="3" required />
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Características">
          <div class="grid">
            <div class="col-12 md:col-4">
              <label>Marca</label>
              <InputText v-model="form.brand" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
              <label>Modelo</label>
              <InputText v-model="form.model" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
              <label>Número de Série</label>
              <InputText v-model="form.serial_number" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
              <label>TAG</label>
              <InputText v-model="form.tag" class="w-full" />
            </div>
            <div class="col-12 md:col-4">
              <label>Condição de Uso</label>
              <Dropdown v-model="form.use_condition_id" :options="condicoesUso" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear />
            </div>
            <div class="col-12 md:col-4">
              <label>Ano de Fabricação</label>
              <InputNumber v-model="form.manufacture_year" class="w-full" />
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Classificação">
          <div class="grid">
            <div class="col-12 md:col-6">
              <label>Filial</label>
              <Dropdown v-model="form.branch_id" :options="filiais" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear />
            </div>
            <div class="col-12 md:col-6">
              <label>Local</label>
              <Dropdown v-model="form.location_id" :options="locais" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear />
            </div>
            <div class="col-12 md:col-6">
              <label>Responsável</label>
              <Dropdown v-model="form.responsible_id" :options="usuarios" optionLabel="nome_completo" optionValue="id" placeholder="Selecione" class="w-full" showClear />
            </div>
            <div class="col-12 md:col-6">
              <label>Centro de Custo</label>
              <Dropdown v-model="form.cost_center_id" :options="centrosCusto" optionLabel="description" optionValue="id" placeholder="Selecione" class="w-full" showClear />
            </div>
            <div class="col-12 md:col-6">
              <label>Conta</label>
              <Dropdown v-model="form.account_id" :options="contas" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear />
            </div>
            <div class="col-12 md:col-6">
              <label>Projeto</label>
              <Dropdown v-model="form.project_id" :options="projetos" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear />
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Valores">
          <div class="grid">
            <div class="col-12 md:col-6">
              <label>Valor (R$) *</label>
              <InputNumber v-model="form.value_brl" mode="currency" currency="BRL" locale="pt-BR" class="w-full" />
            </div>
            <div class="col-12 md:col-6">
              <label>Valor (US$)</label>
              <InputNumber v-model="form.value_usd" mode="currency" currency="USD" locale="en-US" class="w-full" />
            </div>
          </div>
        </TabPanel>
      </TabView>

      <div class="flex justify-content-end mt-4 gap-2">
        <Button label="Cancelar" class="p-button-outlined" @click="$router.back()" />
        <Button label="Salvar" type="submit" :loading="salvando" />
      </div>
    </form>

    <Toast />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import AssetService from '@/service/AssetService';
import AssetAuxiliaryService from '@/service/AssetAuxiliaryService';
import StockLocationService from '@/service/StockLocationService';
import CostcenterService from '@/service/CostcenterService';
import UserService from '@/service/UserService';

export default {
  name: 'AtivosForm',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const id = route.params.id;
    const service = new AssetService();

    const form = ref({
      asset_number: '',
      acquisition_date: new Date(),
      status: 'incluido',
      description: '',
      brand: '',
      model: '',
      serial_number: '',
      tag: '',
      use_condition_id: null,
      manufacture_year: null,
      branch_id: null,
      location_id: null,
      responsible_id: null,
      cost_center_id: null,
      account_id: null,
      project_id: null,
      value_brl: 0,
      value_usd: null,
    });

    const salvando = ref(false);
    const filiais = ref([]);
    const locais = ref([]);
    const usuarios = ref([]);
    const centrosCusto = ref([]);
    const condicoesUso = ref([]);
    const descricoesPadrao = ref([]);
    const contas = ref([]);
    const projetos = ref([]);

    const statusOptions = [
      { label: 'Incluído', value: 'incluido' },
      { label: 'Baixado', value: 'baixado' },
      { label: 'Transferido', value: 'transferido' },
    ];

    const carregar = async () => {
      if (id) {
        try {
          const { data } = await service.get(id);
          const asset = data.data || data;
          Object.keys(form.value).forEach(key => {
            if (asset[key] !== undefined) {
              form.value[key] = asset[key];
            }
          });
          if (asset.acquisition_date) {
            form.value.acquisition_date = new Date(asset.acquisition_date);
          }
        } catch (error) {
          toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar ativo', life: 3000 });
        }
      }
    };

    const carregarAuxiliares = async () => {
      try {
        const [filiaisRes, locaisRes, usuariosRes, centrosRes, condicoesRes, descricoesRes, contasRes, projetosRes] = await Promise.all([
          new AssetAuxiliaryService('filiais').getAll(),
          new StockLocationService().getAll(),
          new UserService().getAll(),
          new CostcenterService().getAll(),
          new AssetAuxiliaryService('condicoes-uso').getAll(),
          new AssetAuxiliaryService('descricoes-padrao').getAll(),
          new AssetAuxiliaryService('contas').getAll(),
          new AssetAuxiliaryService('projetos').getAll(),
        ]);

        filiais.value = filiaisRes.data?.data || filiaisRes.data || [];
        locais.value = locaisRes.data?.data || locaisRes.data || [];
        usuarios.value = usuariosRes.data?.data || usuariosRes.data || [];
        centrosCusto.value = centrosRes.data?.data || centrosRes.data || [];
        condicoesUso.value = condicoesRes.data?.data || condicoesRes.data || [];
        descricoesPadrao.value = descricoesRes.data?.data || descricoesRes.data || [];
        contas.value = contasRes.data?.data || contasRes.data || [];
        projetos.value = projetosRes.data?.data || projetosRes.data || [];
      } catch (error) {
        console.error('Erro ao carregar dados auxiliares:', error);
      }
    };

    const salvar = async () => {
      try {
        salvando.value = true;
        const dataToSave = { ...form.value };
        if (dataToSave.acquisition_date instanceof Date) {
          dataToSave.acquisition_date = dataToSave.acquisition_date.toISOString().split('T')[0];
        }
        await service.save({ ...dataToSave, id: id || undefined });
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Ativo salvo com sucesso', life: 3000 });
        router.push('/ativos/controle');
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao salvar ativo', life: 3000 });
      } finally {
        salvando.value = false;
      }
    };

    onMounted(() => {
      carregarAuxiliares();
      if (id) carregar();
    });

    return {
      id,
      form,
      salvando,
      filiais,
      locais,
      usuarios,
      centrosCusto,
      condicoesUso,
      descricoesPadrao,
      contas,
      projetos,
      statusOptions,
      salvar,
    };
  },
};
</script>

