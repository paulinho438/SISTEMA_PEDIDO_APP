<template>
  <div class="card p-5 bg-page">
    <div class="flex justify-content-between align-items-center mb-3">
      <h5 class="text-900 mb-0">Produtos de Estoque</h5>
      <div class="flex gap-2">
        <Button 
          v-if="podeImportar"
          label="Importar Excel" 
          icon="pi pi-upload" 
          class="p-button-info"
          @click="abrirModalImportacao" 
        />
        <Button 
          v-if="podeCriar"
          label="Novo Produto" 
          icon="pi pi-plus" 
          @click="$router.push('/estoque/produtos/add')" 
        />
      </div>
    </div>

    <div class="flex justify-content-end mb-3">
      <span class="p-input-icon-left">
        <i class="pi pi-search" />
        <InputText v-model="filtroGlobal" placeholder="Buscar..." class="p-inputtext-sm" style="width: 16rem" />
      </span>
    </div>

    <DataTable
      :value="produtosFiltrados"
      :paginator="true"
      :rows="10"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
    >
      <Column field="code" header="Código" sortable></Column>
      <Column field="reference" header="Referência" sortable></Column>
      <Column field="description" header="Descrição" sortable></Column>
      <Column field="unit" header="Unidade" sortable></Column>
      <Column field="active" header="Ativo" sortable>
        <template #body="slotProps">
          <Tag :value="slotProps.data.active ? 'Sim' : 'Não'" :severity="slotProps.data.active ? 'success' : 'danger'" />
        </template>
      </Column>
      <Column header="Ações">
        <template #body="slotProps">
          <Button
            v-if="podeVisualizar"
            icon="pi pi-eye"
            class="p-button-rounded p-button-text p-button-info mr-2"
            @click="$router.push(`/estoque/produtos/${slotProps.data.id}?view=true`)"
            v-tooltip.top="'Visualizar'"
          />
          <Button
            v-if="podeEditar"
            icon="pi pi-pencil"
            class="p-button-rounded p-button-text p-button-info mr-2"
            @click="$router.push(`/estoque/produtos/${slotProps.data.id}`)"
            v-tooltip.top="'Editar'"
          />
          <Button
            v-if="podeDeletar"
            :icon="slotProps.data.active ? 'pi pi-ban' : 'pi pi-check'"
            :class="slotProps.data.active ? 'p-button-rounded p-button-text p-button-warning' : 'p-button-rounded p-button-text p-button-success'"
            @click="toggleActive(slotProps.data)"
            v-tooltip.top="slotProps.data.active ? 'Desativar' : 'Ativar'"
          />
        </template>
      </Column>
    </DataTable>

    <!-- Modal de Importação Excel -->
    <Dialog 
      v-model:visible="modalImportacao.visivel" 
      modal 
      header="Importar Produtos via Excel" 
      :style="{ width: '600px' }" 
      appendTo="body"
    >
      <div class="mb-4">
        <Message severity="info" :closable="false" class="mb-3">
          <p class="m-0">
            <strong>Instruções:</strong>
            <br />1. Baixe o template Excel abaixo
            <br />2. Preencha com os dados dos produtos
            <br />3. Faça o upload do arquivo preenchido
          </p>
        </Message>

        <div class="mb-3">
          <Button 
            label="Baixar Template Excel" 
            icon="pi pi-download" 
            class="p-button-outlined p-button-info w-full"
            @click="baixarTemplate"
          />
        </div>

        <div class="mb-3">
          <label class="block text-600 mb-2">Selecione o arquivo Excel *</label>
          <FileUpload
            mode="basic"
            name="file"
            accept=".xlsx,.xls"
            :maxFileSize="10485760"
            :auto="false"
            chooseLabel="Selecionar Arquivo"
            @select="onFileSelect"
            class="w-full"
          />
          <small v-if="modalImportacao.arquivo" class="text-500">
            Arquivo selecionado: {{ modalImportacao.arquivo.name }}
          </small>
        </div>

        <div v-if="modalImportacao.resultado" class="mt-3">
          <Message 
            :severity="modalImportacao.resultado.erros?.length > 0 ? 'warn' : 'success'" 
            :closable="false"
          >
            <div>
              <p class="font-semibold mb-2">Resultado da Importação:</p>
              <p class="m-0">✓ Produtos importados com sucesso: <strong>{{ modalImportacao.resultado.sucesso }}</strong></p>
              <p class="m-0" v-if="modalImportacao.resultado.ignorados > 0">
                ⚠ Linhas ignoradas: <strong>{{ modalImportacao.resultado.ignorados }}</strong>
              </p>
              <div v-if="modalImportacao.resultado.erros?.length > 0" class="mt-2">
                <p class="font-semibold mb-1">Erros encontrados:</p>
                <ul class="m-0 pl-3" style="max-height: 200px; overflow-y: auto;">
                  <li v-for="(erro, index) in modalImportacao.resultado.erros" :key="index" class="text-sm">
                    {{ erro }}
                  </li>
                </ul>
              </div>
            </div>
          </Message>
        </div>
      </div>

      <template #footer>
        <Button 
          label="Cancelar" 
          class="p-button-text" 
          @click="fecharModalImportacao" 
        />
        <Button
          label="Importar"
          icon="pi pi-upload"
          class="p-button-success"
          :disabled="!modalImportacao.arquivo"
          :loading="modalImportacao.processando"
          @click="processarImportacao"
        />
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useStore } from 'vuex';
import Message from 'primevue/message';
import PermissionsService from '@/service/PermissionsService';
import StockProductService from '@/service/StockProductService';

export default {
  name: 'ProdutosList',
  setup() {
    const toast = useToast();
    const store = useStore();
    const permissionService = new PermissionsService();
    const produtos = ref([]);
    const filtroGlobal = ref('');
    const carregando = ref(false);
    const service = new StockProductService();

    const modalImportacao = ref({
      visivel: false,
      arquivo: null,
      processando: false,
      resultado: null,
    });

    // Verificar permissões
    const podeCriar = computed(() => permissionService.hasPermissions('view_estoque_produtos_create'));
    const podeVisualizar = computed(() => permissionService.hasPermissions('view_estoque_produtos'));
    const podeEditar = computed(() => permissionService.hasPermissions('view_estoque_produtos_edit'));
    const podeDeletar = computed(() => permissionService.hasPermissions('view_estoque_produtos_delete'));
    const podeImportar = computed(() => permissionService.hasPermissions('import_estoque_produtos_excel'));

    const produtosFiltrados = computed(() => {
      if (!filtroGlobal.value) return produtos.value;
      const filtro = filtroGlobal.value.toLowerCase();
      return produtos.value.filter(p =>
        p.code?.toLowerCase().includes(filtro) ||
        p.reference?.toLowerCase().includes(filtro) ||
        p.description?.toLowerCase().includes(filtro)
      );
    });

    const carregar = async () => {
      try {
        carregando.value = true;
        const { data } = await service.getAll({ per_page: 100 });
        produtos.value = data.data || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar produtos', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };

    const toggleActive = async (produto) => {
      try {
        await service.toggleActive(produto.id);
        await carregar();
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Status alterado com sucesso', life: 3000 });
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao alterar status', life: 3000 });
      }
    };

    const abrirModalImportacao = () => {
      modalImportacao.value.visivel = true;
      modalImportacao.value.arquivo = null;
      modalImportacao.value.resultado = null;
    };

    const fecharModalImportacao = () => {
      modalImportacao.value.visivel = false;
      modalImportacao.value.arquivo = null;
      modalImportacao.value.resultado = null;
    };

    const onFileSelect = (event) => {
      modalImportacao.value.arquivo = event.files[0];
    };

    const baixarTemplate = async () => {
      try {
        const response = await service.baixarTemplate();
        const blob = response.data;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'template_importacao_produtos.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.add({
          severity: 'success',
          summary: 'Template',
          detail: 'Template Excel baixado com sucesso!',
          life: 3000
        });
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao baixar template',
          life: 3000
        });
      }
    };

    const processarImportacao = async () => {
      if (!modalImportacao.value.arquivo) {
        toast.add({
          severity: 'warn',
          summary: 'Atenção',
          detail: 'Selecione um arquivo Excel',
          life: 3000
        });
        return;
      }

      try {
        modalImportacao.value.processando = true;
        modalImportacao.value.resultado = null;

        const response = await service.importarExcel(modalImportacao.value.arquivo);
        
        modalImportacao.value.resultado = response.data.data || response.data;

        if (modalImportacao.value.resultado.sucesso > 0) {
          toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `${modalImportacao.value.resultado.sucesso} produto(s) importado(s) com sucesso!`,
            life: 5000
          });
          await carregar();
        }

        if (modalImportacao.value.resultado.erros?.length > 0) {
          toast.add({
            severity: 'warn',
            summary: 'Atenção',
            detail: `${modalImportacao.value.resultado.ignorados} linha(s) foram ignoradas. Verifique os erros no resultado.`,
            life: 5000
          });
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Erro ao importar arquivo';
        
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: errorMessage,
          life: 5000
        });
      } finally {
        modalImportacao.value.processando = false;
      }
    };

    onMounted(() => {
      carregar();
    });

    return {
      produtos,
      filtroGlobal,
      produtosFiltrados,
      carregando,
      modalImportacao,
      toggleActive,
      abrirModalImportacao,
      fecharModalImportacao,
      onFileSelect,
      baixarTemplate,
      processarImportacao,
      podeCriar,
      podeVisualizar,
      podeEditar,
      podeDeletar,
      podeImportar,
    };
  },
  components: {
    Message,
  },
};
</script>

