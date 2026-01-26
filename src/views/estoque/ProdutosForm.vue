<template>
  <div class="card p-5 bg-page">
    <div class="flex align-items-center justify-content-between mb-3">
      <h5 class="text-900 mb-0">{{ isViewMode ? 'Visualizar' : (id ? 'Editar' : 'Novo') }} Produto</h5>
      <Button 
        v-if="isViewMode && podeEditar"
        label="Editar" 
        icon="pi pi-pencil" 
        class="p-button-outlined"
        @click="editar" 
      />
    </div>

    <form @submit.prevent="salvar">
      <div class="grid">
        <!-- Coluna Principal -->
        <div class="col-12 lg:col-8">
          <div class="grid">
            <div class="col-12 md:col-6" v-if="id && isViewMode">
              <label for="code">Código</label>
              <InputText id="code" v-model="form.code" class="w-full" disabled />
              <small class="text-500">Código gerado automaticamente pelo sistema</small>
            </div>
            <div class="col-12 md:col-6" v-else-if="id">
              <label for="code">Código</label>
              <InputText id="code" v-model="form.code" class="w-full" disabled />
              <small class="text-500">Código gerado automaticamente pelo sistema</small>
            </div>
            <div class="col-12 md:col-6">
              <label for="reference">Referência</label>
              <InputText id="reference" v-model="form.reference" class="w-full" :disabled="isViewMode || !podeEditar" />
            </div>
            <div class="col-12">
              <label for="description">Descrição *</label>
              <InputText id="description" v-model="form.description" class="w-full" :disabled="isViewMode || !podeEditar" required />
            </div>
            <div class="col-12 md:col-6">
              <label for="unit">Unidade *</label>
              <InputText id="unit" v-model="form.unit" class="w-full" :disabled="isViewMode || !podeEditar" required />
            </div>
            <div class="col-12 md:col-6">
              <label for="active">Ativo</label>
              <div class="flex align-items-center mt-2">
                <Checkbox id="active" v-model="form.active" :binary="true" :disabled="isViewMode || !podeEditar" />
                <label for="active" class="ml-2">Produto ativo</label>
              </div>
            </div>
            
            <!-- Campos de Estoque -->
            <div class="col-12">
              <h6 class="mb-3">Controle de Estoque</h6>
            </div>
            <div class="col-12 md:col-6">
              <label for="min_stock">Estoque Mínimo</label>
              <InputNumber 
                id="min_stock" 
                v-model="form.min_stock" 
                class="w-full" 
                :disabled="isViewMode || !podeEditar"
                :min="0"
                :useGrouping="false"
                :minFractionDigits="0"
                :maxFractionDigits="0"
              />
            </div>
            <div class="col-12 md:col-6">
              <label for="max_stock">Estoque Máximo</label>
              <InputNumber 
                id="max_stock" 
                v-model="form.max_stock" 
                class="w-full" 
                :disabled="isViewMode || !podeEditar"
                :min="0"
                :useGrouping="false"
                :minFractionDigits="0"
                :maxFractionDigits="0"
              />
            </div>
          </div>
        </div>

        <!-- Seção de Estoques por Local (apenas em modo visualização) -->
        <div v-if="isViewMode && id && stocks.length > 0" class="col-12 mt-4">
          <div class="card">
            <h6 class="mb-3">Estoques por Local</h6>
            <DataTable 
              :value="stocks" 
              :loading="carregandoEstoques"
              responsiveLayout="scroll"
              class="p-datatable-sm"
            >
              <Column field="location_name" header="Local" sortable>
                <template #body="slotProps">
                  <div>
                    <div class="font-semibold">{{ slotProps.data.location_name || '-' }}</div>
                    <div v-if="slotProps.data.location_code" class="text-sm text-500">{{ slotProps.data.location_code }}</div>
                  </div>
                </template>
              </Column>
              <Column field="quantity_available" header="Disponível" sortable>
                <template #body="slotProps">
                  <div>
                    <span :class="getStockClass(slotProps.data.quantity_available, form.min_stock)">
                      {{ formatQuantity(slotProps.data.quantity_available) }} {{ form.unit }}
                    </span>
                    <Tag 
                      v-if="form.min_stock && slotProps.data.quantity_available < form.min_stock"
                      value="Abaixo do mínimo"
                      severity="warning"
                      class="ml-2"
                    />
                  </div>
                </template>
              </Column>
              <Column field="quantity_reserved" header="Reservado" sortable>
                <template #body="slotProps">
                  {{ formatQuantity(slotProps.data.quantity_reserved) }} {{ form.unit }}
                </template>
              </Column>
              <Column field="quantity_total" header="Total" sortable>
                <template #body="slotProps">
                  {{ formatQuantity(slotProps.data.quantity_total) }} {{ form.unit }}
                </template>
              </Column>
              <Column field="last_movement_at" header="Última Movimentação" sortable>
                <template #body="slotProps">
                  {{ slotProps.data.last_movement_at || '-' }}
                </template>
              </Column>
            </DataTable>
          </div>
        </div>

        <div v-else-if="isViewMode && id && stocks.length === 0" class="col-12 mt-4">
          <div class="card">
            <h6 class="mb-3">Estoques por Local</h6>
            <div class="text-center text-500 py-4">
              Este produto não possui estoque em nenhum local.
            </div>
          </div>
        </div>

        <!-- Sidebar - Imagem -->
        <div class="col-12 lg:col-4">
          <div class="card p-3">
            <h6 class="mb-3">Imagem do Produto</h6>
            
            <!-- Preview da Imagem -->
            <div v-if="imageUrl || form.image_path" class="mb-3 text-center">
              <img 
                :src="imageUrl || getImageUrl(form.image_path)" 
                alt="Imagem do produto" 
                class="w-full border-round"
                style="max-height: 300px; object-fit: contain;"
              />
            </div>
            
            <!-- Upload de Imagem -->
            <div v-if="!isViewMode && podeEditar" class="flex flex-column gap-2">
              <FileUpload
                mode="basic"
                accept="image/*"
                :maxFileSize="5120000"
                :auto="false"
                chooseLabel="Adicionar Imagem"
                @select="onImageSelect"
                class="w-full"
              />
              
              <Button
                v-if="imageUrl || form.image_path"
                label="Remover Imagem"
                icon="pi pi-times"
                class="p-button-danger p-button-outlined w-full"
                @click="removerImagem"
                :loading="removendoImagem"
              />
            </div>
            
            <div v-else-if="!imageUrl && !form.image_path" class="text-center text-500 py-4">
              Nenhuma imagem cadastrada
            </div>
          </div>
        </div>
      </div>

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
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import PermissionsService from '@/service/PermissionsService';
import StockProductService from '@/service/StockProductService';

export default {
  name: 'ProdutosForm',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const permissionService = new PermissionsService();
    const id = route.params.id;
    const isViewMode = computed(() => route.query.view === 'true');
    const service = new StockProductService();
    const apiPath = import.meta.env.VITE_APP_BASE_URL;

    // Verificar permissões
    const podeVisualizar = computed(() => permissionService.hasPermissions('view_estoque_produtos'));
    const podeEditar = computed(() => permissionService.hasPermissions('view_estoque_produtos_edit'));
    const podeCriar = computed(() => permissionService.hasPermissions('view_estoque_produtos_create'));

    // Verificar se pode acessar a página
    if (!id && !podeCriar.value) {
      toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para criar produtos', life: 3000 });
      router.push('/estoque/produtos');
    }
    
    if (id) {
      if (isViewMode.value && !podeVisualizar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para visualizar produtos', life: 3000 });
        router.push('/estoque/produtos');
      } else if (!isViewMode.value && !podeEditar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para editar produtos', life: 3000 });
        router.push('/estoque/produtos');
      }
    }

    const form = ref({
      code: '', // Código será gerado automaticamente pelo sistema
      reference: '',
      description: '',
      unit: 'UN',
      active: true,
      min_stock: null,
      max_stock: null,
      image_path: null,
    });
    const salvando = ref(false);
    const imageUrl = ref(null);
    const removendoImagem = ref(false);
    const selectedFile = ref(null);
    const stocks = ref([]);
    const carregandoEstoques = ref(false);

    const getImageUrl = (path) => {
      if (!path) return null;
      // Remover /api do caminho se existir, pois o storage está na raiz
      const baseUrl = apiPath.replace('/api', '');
      return `${baseUrl}/storage/${path}`;
    };

    const onImageSelect = (event) => {
      const file = event.files[0];
      if (!file) return;

      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Por favor, selecione um arquivo de imagem', life: 3000 });
        return;
      }

      // Validar tamanho (5MB)
      if (file.size > 5120000) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'A imagem deve ter no máximo 5MB', life: 3000 });
        return;
      }

      selectedFile.value = file;
      
      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        imageUrl.value = e.target.result;
      };
      reader.readAsDataURL(file);
    };

    const uploadImagem = async () => {
      if (!selectedFile.value || !id) return;

      try {
        await service.uploadImage(id, selectedFile.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Imagem enviada com sucesso', life: 3000 });
        selectedFile.value = null;
        // Recarregar produto para obter o caminho da imagem
        await carregar();
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

    const formatQuantity = (value) => {
      if (value === null || value === undefined) return '0';
      return parseFloat(value).toLocaleString('pt-BR', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      });
    };

    const getStockClass = (quantity, minStock) => {
      if (!minStock) return '';
      if (quantity < minStock) {
        return quantity === 0 ? 'text-red-500 font-bold' : 'text-orange-500 font-semibold';
      }
      return '';
    };

    const carregar = async () => {
      if (id) {
        try {
          carregandoEstoques.value = true;
          const { data } = await service.get(id);
          const productData = data.data || data;
          form.value = {
            code: productData.code || '',
            reference: productData.reference || '',
            description: productData.description || '',
            unit: productData.unit || 'UN',
            active: productData.active !== undefined ? productData.active : true,
            min_stock: productData.min_stock || null,
            max_stock: productData.max_stock || null,
            image_path: productData.image_path || null,
          };
          
          // Usar image_url do backend se disponível, senão construir a URL
          if (productData.image_url) {
            imageUrl.value = productData.image_url;
          } else if (productData.image_path) {
            imageUrl.value = getImageUrl(productData.image_path);
          }

          // Carregar estoques se estiverem disponíveis
          if (productData.stocks) {
            stocks.value = productData.stocks;
          }
        } catch (error) {
          toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar produto', life: 3000 });
        } finally {
          carregandoEstoques.value = false;
        }
      }
    };

    const salvar = async () => {
      if (isViewMode.value || !podeEditar.value) {
        return;
      }

      if (id && !podeEditar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para editar produtos', life: 3000 });
        return;
      }

      if (!id && !podeCriar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para criar produtos', life: 3000 });
        return;
      }

      try {
        salvando.value = true;
        // Remover código ao criar novo produto (será gerado automaticamente pelo sistema)
        const productData = { ...form.value };
        if (!id) {
          delete productData.code; // Não enviar código na criação
        }
        const savedProduct = await service.save({ ...productData, id: id || undefined });
        
        // Se houver imagem selecionada e produto foi criado/editado, fazer upload
        if (selectedFile.value) {
          const productId = id || (savedProduct.data?.data?.id || savedProduct.data?.id);
          if (productId) {
            await service.uploadImage(productId, selectedFile.value);
          }
        }
        
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto salvo com sucesso', life: 3000 });
        router.push('/estoque/produtos');
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao salvar produto', life: 3000 });
      } finally {
        salvando.value = false;
      }
    };

    const editar = () => {
      router.push(`/estoque/produtos/${id}`);
    };

    onMounted(() => {
      if (id) carregar();
    });

    return {
      id,
      form,
      salvando,
      salvar,
      isViewMode,
      podeEditar,
      podeCriar,
      editar,
      imageUrl,
      removendoImagem,
      onImageSelect,
      removerImagem,
      getImageUrl,
      stocks,
      carregandoEstoques,
      formatQuantity,
      getStockClass,
    };
  },
};
</script>
