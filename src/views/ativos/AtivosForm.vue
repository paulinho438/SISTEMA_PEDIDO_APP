<template>
  <div class="card p-5 bg-page">
    <div class="flex align-items-center justify-content-between mb-3">
      <h5 class="text-900 mb-0">{{ isViewMode ? 'Visualizar' : (id ? 'Editar' : 'Novo') }} Ativo</h5>
      <Button 
        v-if="isViewMode && podeEditar"
        label="Editar" 
        icon="pi pi-pencil" 
        class="p-button-outlined"
        @click="editar" 
      />
    </div>

    <form @submit.prevent="salvar" novalidate>
      <TabView>
        <TabPanel header="Informações Gerais">
          <div class="grid">
            <div class="col-12 md:col-6">
              <label>Número do Ativo</label>
              <InputText
                v-model="form.asset_number"
                class="w-full"
                :placeholder="!id ? 'Será gerado automaticamente' : ''"
                :disabled="!id || isViewMode || !podeEditar"
              />
            </div>
            <div class="col-12 md:col-6">
              <label>Data de Aquisição *</label>
              <Calendar v-model="form.acquisition_date" dateFormat="dd/mm/yy" class="w-full" :showIcon="true" :disabled="isViewMode || !podeEditar" />
            </div>
            <div class="col-12 md:col-6">
              <label>Descrição Padrão</label>
              <Dropdown v-model="form.standard_description_id" :options="descricoesPadrao" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear :disabled="isViewMode || !podeEditar" />
            </div>
            <div class="col-12 md:col-6">
              <label>Status</label>
              <Dropdown v-model="form.status" :options="statusOptions" optionLabel="label" optionValue="value" class="w-full" :disabled="isViewMode || !podeEditar" />
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Características">
          <div class="grid">
            <div class="col-12 md:col-4">
              <label>Marca</label>
              <InputText v-model="form.brand" class="w-full" :disabled="isViewMode || !podeEditar" />
            </div>
            <div class="col-12 md:col-4">
              <label>Modelo</label>
              <InputText v-model="form.model" class="w-full" :disabled="isViewMode || !podeEditar" />
            </div>
            <div class="col-12 md:col-4">
              <label>Número de Série</label>
              <InputText v-model="form.serial_number" class="w-full" :disabled="isViewMode || !podeEditar" />
            </div>
            <div class="col-12 md:col-4">
              <label>TAG</label>
              <InputText v-model="form.tag" class="w-full" :disabled="isViewMode || !podeEditar" />
            </div>
            <div class="col-12 md:col-4">
              <label>Condição de Uso</label>
              <Dropdown v-model="form.use_condition_id" :options="condicoesUso" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear :disabled="isViewMode || !podeEditar" />
            </div>
            <div class="col-12 md:col-4">
              <label>Ano de Fabricação</label>
              <InputNumber v-model="form.manufacture_year" class="w-full" :disabled="isViewMode || !podeEditar" />
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Imagem">
          <div class="card p-3">
            <h6 class="mb-3">Imagem do Ativo</h6>
            
            <!-- Preview da Imagem -->
            <div v-if="imageUrl || form.image_path" class="mb-3 text-center">
              <img 
                :src="imageUrl || getImageUrl(form.image_path)" 
                alt="Imagem do ativo" 
                class="w-full border-round"
                style="max-height: 300px; object-fit: contain;"
              />
            </div>
            
            <!-- Upload de Imagem -->
            <div v-if="!isViewMode && podeEditar" class="mb-3">
              <FileUpload
                mode="basic"
                accept="image/*"
                :maxFileSize="5242880"
                chooseLabel="Adicionar Imagem"
                @select="onImageSelect"
                class="w-full"
              />
              <Button
                v-if="imageUrl || form.image_path"
                label="Remover Imagem"
                icon="pi pi-trash"
                class="p-button-danger p-button-outlined w-full mt-2"
                @click="removerImagem"
                :loading="removendoImagem"
              />
            </div>
            <div v-else-if="!imageUrl && !form.image_path" class="text-center text-500 py-4">
              Nenhuma imagem cadastrada
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Classificação">
          <div class="grid">
            <div class="col-12 md:col-6">
              <label>Filial</label>
              <Dropdown v-model="form.branch_id" :options="filiais" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear :disabled="isViewMode || !podeEditar" />
            </div>
            <div class="col-12 md:col-6">
              <label>Local</label>
              <Dropdown v-model="form.location_id" :options="locais" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear :disabled="isViewMode || !podeEditar" />
            </div>
            <div class="col-12 md:col-6">
              <label>Responsável</label>
              <Dropdown v-model="form.responsible_id" :options="responsaveis" optionLabel="name" optionValue="id" placeholder="Selecione" class="w-full" showClear :disabled="isViewMode || !podeEditar" />
            </div>
            <div class="col-12 md:col-6">
              <label>Centro de Custo</label>
              <Dropdown v-model="form.cost_center_id" :options="centrosCusto" optionLabel="description" optionValue="id" placeholder="Selecione" class="w-full" showClear :disabled="isViewMode || !podeEditar" />
            </div>
          </div>
        </TabPanel>

        <TabPanel header="Valores">
          <div class="grid">
            <div class="col-12 md:col-6">
              <label>Valor (R$) *</label>
              <InputNumber v-model="form.value_brl" mode="currency" currency="BRL" locale="pt-BR" class="w-full" :disabled="isViewMode || !podeEditar" />
            </div>
            <div class="col-12 md:col-6">
              <label>Valor (US$)</label>
              <InputNumber v-model="form.value_usd" mode="currency" currency="USD" locale="en-US" class="w-full" :disabled="isViewMode || !podeEditar" />
            </div>
          </div>
        </TabPanel>
      </TabView>

      <div class="flex justify-content-end mt-4 gap-2">
        <Button label="Cancelar" class="p-button-outlined" @click="$router.back()" />
        <Button 
          v-if="!isViewMode && podeEditar" 
          label="Salvar" 
          type="submit" 
          :loading="salvando" 
        />
      </div>
    </form>

    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import PermissionsService from '@/service/PermissionsService';
import AssetService from '@/service/AssetService';
import AssetAuxiliaryService from '@/service/AssetAuxiliaryService';
import CostcenterService from '@/service/CostcenterService';

export default {
  name: 'AtivosForm',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const permissionService = new PermissionsService();
    const id = route.params.id;
    const isViewMode = computed(() => route.query.view === 'true');
    const service = new AssetService();

    // Verificar permissões
    const podeVisualizar = computed(() => permissionService.hasPermissions('view_ativos'));
    const podeEditar = computed(() => permissionService.hasPermissions('view_ativos_edit'));
    const podeCriar = computed(() => permissionService.hasPermissions('view_ativos_create'));

    // Verificar se pode acessar a página
    if (!id && !podeCriar.value) {
      toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para criar ativos', life: 3000 });
      router.push('/ativos/controle');
    }
    
    if (id) {
      if (isViewMode.value && !podeVisualizar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para visualizar ativos', life: 3000 });
        router.push('/ativos/controle');
      } else if (!isViewMode.value && !podeEditar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para editar ativos', life: 3000 });
        router.push('/ativos/controle');
      }
    }

    const form = ref({
      asset_number: '',
      acquisition_date: new Date(),
      status: 'incluido',
      standard_description_id: null,
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
      value_brl: 0,
      value_usd: null,
      image_path: null,
    });

    const salvando = ref(false);
    const filiais = ref([]);
    const locais = ref([]);
    const responsaveis = ref([]);
    const centrosCusto = ref([]);
    const condicoesUso = ref([]);
    const descricoesPadrao = ref([]);
    
    const imageUrl = ref(null);
    const selectedFile = ref(null);
    const removendoImagem = ref(false);

    const statusOptions = [
      { label: 'Incluído', value: 'incluido' },
      { label: 'Baixado', value: 'baixado' },
      { label: 'Transferido', value: 'transferido' },
    ];

    const getImageUrl = (path) => {
      if (!path) return null;
      const baseUrl = import.meta.env.VITE_APP_BASE_URL || '';
      const cleanBaseUrl = baseUrl.replace('/api', '');
      return `${cleanBaseUrl}/storage/${path}`;
    };

    const onImageSelect = (event) => {
      const file = event.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Por favor, selecione um arquivo de imagem', life: 3000 });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'A imagem deve ter no máximo 5MB', life: 3000 });
        return;
      }

      selectedFile.value = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        imageUrl.value = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    const uploadImagem = async (assetIdParam) => {
      const targetId = assetIdParam ?? id;
      if (!selectedFile.value || !targetId) return;
      try {
        await service.uploadImage(targetId, selectedFile.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Imagem enviada com sucesso', life: 3000 });
        selectedFile.value = null;
        // Recarregar ativo para obter o caminho da imagem (só se estivermos na tela de edição desse ativo)
        if (id) await carregar();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao enviar imagem', life: 3000 });
      }
    };

    const removerImagem = async () => {
      if (!id) return;
      try {
        removendoImagem.value = true;
        await service.removeImage(id);
        imageUrl.value = null;
        form.value.image_path = null;
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Imagem removida com sucesso', life: 3000 });
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao remover imagem', life: 3000 });
      } finally {
        removendoImagem.value = false;
      }
    };

    const carregar = async () => {
      if (id) {
        try {
          const { data } = await service.get(id);
          const asset = data.data || data;
          
          // Mapear todos os campos, incluindo IDs de relacionamentos
          Object.keys(form.value).forEach(key => {
            if (asset[key] === undefined) return;
            // cost_center_id é tratado abaixo com fallback de relacionamentos e código Protheus
            if (key === 'cost_center_id') return;
            // Converter IDs para number para garantir compatibilidade com dropdowns
            if (key.endsWith('_id') && asset[key] !== null) {
              form.value[key] = parseInt(asset[key]);
            } else {
              form.value[key] = asset[key];
            }
          });
          
          // Mapear relacionamentos caso os IDs não venham diretamente (fallback)
          if (!form.value.location_id && asset.location?.id) {
            form.value.location_id = parseInt(asset.location.id);
          }
          if (!form.value.responsible_id && asset.responsible?.id) {
            form.value.responsible_id = parseInt(asset.responsible.id);
          }
          if (!form.value.branch_id && asset.branch?.id) {
            form.value.branch_id = parseInt(asset.branch.id);
          }
          // Condição de uso: garantir número e opção na lista; aplicar em nextTick para o Dropdown reconhecer
          const useConditionId = asset.use_condition_id != null
            ? Number(asset.use_condition_id)
            : (asset.use_condition?.id != null ? Number(asset.use_condition.id) : null);
          if (useConditionId != null) {
            // Se a condição não estiver na lista (ex.: inativa), adicionar opção sintética
            const jaNaLista = condicoesUso.value.some(c => Number(c.id) === useConditionId);
            if (!jaNaLista && (asset.use_condition?.name || asset.use_condition_id)) {
              condicoesUso.value = [
                ...condicoesUso.value,
                { id: useConditionId, name: asset.use_condition?.name || `Condição #${useConditionId}` }
              ];
            }
            nextTick(() => {
              form.value.use_condition_id = useConditionId;
            });
          } else {
            form.value.use_condition_id = null;
          }
          // Centro de custo: id numérico ou código Protheus (ex: "6.19")
          if (asset.cost_center_id != null) {
            form.value.cost_center_id = parseInt(asset.cost_center_id);
          } else if (asset.cost_center?.id != null) {
            form.value.cost_center_id = parseInt(asset.cost_center.id);
          } else if (asset.cost_center_code) {
            form.value.cost_center_id = asset.cost_center_code;
          }
          if (!form.value.standard_description_id && asset.standard_description?.id) {
            form.value.standard_description_id = parseInt(asset.standard_description.id);
          }

          if (asset.acquisition_date) {
            // Se a data está em formato dd/mm/yyyy, converter
            if (typeof asset.acquisition_date === 'string' && asset.acquisition_date.includes('/')) {
              const [day, month, year] = asset.acquisition_date.split('/');
              form.value.acquisition_date = new Date(`${year}-${month}-${day}`);
            } else {
              form.value.acquisition_date = new Date(asset.acquisition_date);
            }
          }
          
          // Centro de custo pode ser código Protheus (string): garantir que exista na lista do dropdown
          if (asset.cost_center_code && typeof form.value.cost_center_id === 'string') {
            const jaNaLista = centrosCusto.value.some(c => String(c.id) === String(asset.cost_center_code));
            if (!jaNaLista) {
              centrosCusto.value = [
                ...centrosCusto.value,
                { id: asset.cost_center_code, description: asset.cost_center_code }
              ];
            }
          }

          // Carregar imagem: sempre atualizar form e imageUrl para exibir ou limpar
          form.value.image_path = asset.image_path ?? null;
          if (asset.image_path) {
            // Preferir URL absoluta da API; senão montar com base da API
            imageUrl.value = asset.image_url && asset.image_url.startsWith('http')
              ? asset.image_url
              : getImageUrl(asset.image_path);
          } else {
            imageUrl.value = null;
          }
        } catch (error) {
          toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar ativo', life: 3000 });
        }
      }
    };

    const carregarAuxiliares = async () => {
      try {
        // Se estiver editando, carregar todos (incluindo inativos) para garantir que o item selecionado apareça
        const all = id ? { all: true } : {};
        
        const [filiaisRes, locaisRes, responsaveisRes, centrosRes, condicoesRes, descricoesRes] = await Promise.all([
          new AssetAuxiliaryService('filiais').getAll(all),
          new AssetAuxiliaryService('locais').getAll(all),
          new AssetAuxiliaryService('responsaveis').getAll(all),
          new CostcenterService().getAll(),
          new AssetAuxiliaryService('condicoes-uso').getAll(),
          new AssetAuxiliaryService('descricoes-padrao').getAll(),
        ]);

        filiais.value = filiaisRes.data?.data || filiaisRes.data || [];
        locais.value = locaisRes.data?.data || locaisRes.data || [];
        responsaveis.value = responsaveisRes.data?.data || responsaveisRes.data || [];
        centrosCusto.value = centrosRes.data?.data || centrosRes.data || [];
        // Garantir id numérico nas opções para o Dropdown fazer match com form.use_condition_id
        const condicoesRaw = condicoesRes.data?.data || condicoesRes.data || [];
        condicoesUso.value = Array.isArray(condicoesRaw) ? condicoesRaw.map(c => ({ ...c, id: Number(c.id) })) : [];
        descricoesPadrao.value = descricoesRes.data?.data || descricoesRes.data || [];
      } catch (error) {
        console.error('Erro ao carregar dados auxiliares:', error);
      }
    };

    const salvar = async () => {
      if (isViewMode.value || !podeEditar.value) {
        return;
      }

      if (id && !podeEditar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para editar ativos', life: 3000 });
        return;
      }

      if (!id && !podeCriar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para criar ativos', life: 3000 });
        return;
      }

      // Validação manual (evita "invalid form control is not focusable" em campos dentro de abas ocultas)
      if (!form.value.standard_description_id) {
        toast.add({ severity: 'error', summary: 'Campo obrigatório', detail: 'Selecione a Descrição Padrão.', life: 3000 });
        return;
      }
      if (!form.value.acquisition_date) {
        toast.add({ severity: 'error', summary: 'Campo obrigatório', detail: 'Preencha a Data de Aquisição.', life: 3000 });
        return;
      }
      const valorBrl = form.value.value_brl;
      if (valorBrl == null || valorBrl === '' || Number(valorBrl) < 0) {
        toast.add({ severity: 'error', summary: 'Campo obrigatório', detail: 'Preencha o Valor (R$).', life: 3000 });
        return;
      }

      try {
        salvando.value = true;
        const dataToSave = { ...form.value };
        if (dataToSave.acquisition_date instanceof Date) {
          dataToSave.acquisition_date = dataToSave.acquisition_date.toISOString().split('T')[0];
        }
        // Descrição vem da Descrição Padrão selecionada (nome)
        const descPadrao = descricoesPadrao.value.find(d => d.id == form.value.standard_description_id);
        dataToSave.description = (descPadrao?.name ?? form.value.description ?? '').trim() || (form.value.description ?? '');
        // Garantir que campos opcionais numéricos não sejam enviados como string vazia (backend espera null)
        if (dataToSave.manufacture_year === '' || dataToSave.manufacture_year === undefined) dataToSave.manufacture_year = null;
        if (dataToSave.value_usd === '' || dataToSave.value_usd === undefined) dataToSave.value_usd = null;
        const payload = id ? { ...dataToSave, id } : dataToSave;
        const response = await service.save(payload);
        const assetId = id || (response.data?.data?.id || response.data?.id);
        
        // Se houver imagem selecionada e ativo foi criado/editado, fazer upload (passar assetId para novo ativo)
        if (selectedFile.value && assetId) {
          await uploadImagem(assetId);
        }
        
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Ativo salvo com sucesso', life: 3000 });
        router.push('/ativos/controle');
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao salvar ativo', life: 3000 });
      } finally {
        salvando.value = false;
      }
    };

    const editar = () => {
      router.push(`/ativos/${id}`);
    };

    onMounted(async () => {
      // Se estiver editando, carregar auxiliares primeiro para garantir que os itens estejam disponíveis
      await carregarAuxiliares();
      if (id) {
        // Aguardar um tick para garantir que os dropdowns estão prontos
        await carregar();
      }
    });

    return {
      id,
      form,
      salvando,
      filiais,
      locais,
      responsaveis,
      centrosCusto,
      condicoesUso,
      descricoesPadrao,
      statusOptions,
      isViewMode,
      podeEditar,
      podeCriar,
      imageUrl,
      removendoImagem,
      onImageSelect,
      removerImagem,
      getImageUrl,
      salvar,
      editar,
    };
  },
};
</script>

