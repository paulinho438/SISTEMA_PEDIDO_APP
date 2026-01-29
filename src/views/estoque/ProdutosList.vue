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
        <InputText 
          v-model="filtroGlobal" 
          placeholder="Buscar..." 
          class="p-inputtext-sm" 
          style="width: 16rem"
          @input="onSearchChange"
        />
      </span>
    </div>

    <DataTable
      :value="produtos"
      :paginator="true"
      :rows="(paginacao && paginacao.perPage) || 10"
      :totalRecords="(paginacao && paginacao.total) || 0"
      :lazy="true"
      :first="paginacao ? (paginacao.page - 1) * paginacao.perPage : 0"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
      @page="onPageChange"
      paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
      :rowsPerPageOptions="[10, 20, 50, 100]"
      currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} produtos"
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
      :header="modalImportacao.validacao ? 'Pré-validação do arquivo' : 'Importar Produtos via Excel'" 
      :style="{ width: modalImportacao.validacao ? '90vw' : '600px', maxWidth: modalImportacao.validacao ? '1200px' : '600px' }" 
      appendTo="body"
    >
      <!-- Passo 1: Seleção do arquivo -->
      <div v-if="!modalImportacao.validacao" class="mb-4">
        <Message severity="info" :closable="false" class="mb-3">
          <p class="m-0">
            <strong>Instruções:</strong>
            <br />1. Baixe o template Excel abaixo
            <br />2. Preencha com os dados dos produtos (o código será gerado automaticamente pelo sistema)
            <br />3. Selecione o arquivo e clique em <strong>Analisar arquivo</strong> para ver quais linhas importam corretamente e quais têm erro
            <br />4. Corrija o arquivo se necessário e analise de novo; quando não houver erros, clique em <strong>Importar</strong>
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

      <!-- Passo 2: Tela de pré-validação (todas as linhas e status) -->
      <div v-else class="mb-4">
        <Message 
          :severity="modalImportacao.validacao.total_erro > 0 ? 'warn' : 'success'" 
          :closable="false"
          class="mb-3"
        >
          <p class="m-0">
            <strong>Resumo:</strong>
            <span class="ml-2">✓ Linhas OK (serão importadas): <strong>{{ modalImportacao.validacao.total_ok }}</strong></span>
            <span class="ml-2" v-if="modalImportacao.validacao.total_erro > 0">
              ✗ Linhas com erro: <strong>{{ modalImportacao.validacao.total_erro }}</strong> — corrija o arquivo e analise novamente.
            </span>
            <span class="ml-2" v-if="modalImportacao.validacao.total_vazio > 0">
              (Linhas vazias ignoradas: {{ modalImportacao.validacao.total_vazio }})
            </span>
          </p>
        </Message>

        <DataTable
          :value="modalImportacao.validacao.linhas"
          :scrollable="true"
          scrollHeight="400px"
          class="p-datatable-sm p-datatable-gridlines"
          responsiveLayout="scroll"
          :paginator="modalImportacao.validacao.linhas?.length > 10"
          :rows="10"
          :totalRecords="modalImportacao.validacao.linhas?.length ?? 0"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          :rowsPerPageOptions="[10, 25, 50]"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} linhas"
        >
          <Column field="linha" header="Linha" style="min-width: 4rem" />
          <Column header="Referência" style="min-width: 8rem">
            <template #body="{ data }">{{ data.dados?.referencia ?? '-' }}</template>
          </Column>
          <Column header="Descrição" style="min-width: 12rem">
            <template #body="{ data }">{{ data.dados?.descricao ?? '-' }}</template>
          </Column>
          <Column header="Unidade" style="min-width: 5rem">
            <template #body="{ data }">{{ data.dados?.unidade ?? '-' }}</template>
          </Column>
          <Column header="Local estoque" style="min-width: 8rem">
            <template #body="{ data }">{{ data.dados?.local_estoque ?? '-' }}</template>
          </Column>
          <Column header="Quantidade" style="min-width: 5rem">
            <template #body="{ data }">{{ data.dados?.quantidade ?? '-' }}</template>
          </Column>
          <Column header="Status" style="min-width: 7rem">
            <template #body="{ data }">
              <Tag 
                :value="data.status === 'ok' ? 'OK' : (data.status === 'erro' ? 'Erro' : 'Vazio')" 
                :severity="data.status === 'ok' ? 'success' : (data.status === 'erro' ? 'danger' : 'secondary')" 
              />
            </template>
          </Column>
          <Column header="Mensagem" style="min-width: 14rem">
            <template #body="{ data }">
              <span :class="data.status === 'erro' ? 'text-red-600' : 'text-500'">{{ data.mensagem || '-' }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <template #footer>
        <template v-if="!modalImportacao.validacao">
          <Button label="Cancelar" class="p-button-text" @click="fecharModalImportacao" />
          <Button
            label="Analisar arquivo"
            icon="pi pi-search"
            class="p-button-outlined p-button-info"
            :disabled="!modalImportacao.arquivo"
            :loading="modalImportacao.analisando"
            @click="analisarArquivo"
          />
        </template>
        <template v-else>
          <Button 
            label="Voltar" 
            class="p-button-text" 
            @click="voltarParaSelecaoArquivo" 
          />
          <Button
            label="Importar"
            icon="pi pi-upload"
            class="p-button-success"
            :disabled="modalImportacao.validacao.total_erro > 0"
            :loading="modalImportacao.processando"
            @click="processarImportacao"
          />
        </template>
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
    
    // Estado de paginação
    const paginacao = ref({
      page: 1,
      perPage: 10,
      total: 0,
      lastPage: 1
    });
    
    // Timeout para debounce da busca
    let searchTimeout = null;

    const modalImportacao = ref({
      visivel: false,
      arquivo: null,
      processando: false,
      analisando: false,
      resultado: null,
      validacao: null, // { linhas, total_ok, total_erro, total_vazio } após analisar
    });

    // Verificar permissões
    const podeCriar = computed(() => permissionService.hasPermissions('view_estoque_produtos_create'));
    const podeVisualizar = computed(() => permissionService.hasPermissions('view_estoque_produtos'));
    const podeEditar = computed(() => permissionService.hasPermissions('view_estoque_produtos_edit'));
    const podeDeletar = computed(() => permissionService.hasPermissions('view_estoque_produtos_delete'));
    const podeImportar = computed(() => permissionService.hasPermissions('import_estoque_produtos_excel'));

    const carregar = async () => {
      try {
        carregando.value = true;
        
        const params = {
          page: paginacao.value.page,
          per_page: paginacao.value.perPage
        };
        
        // Adicionar busca se houver filtro
        if (filtroGlobal.value && filtroGlobal.value.trim()) {
          params.search = filtroGlobal.value.trim();
        }
        
        const response = await service.getAll(params);
        const data = response.data;
        
        // Laravel Resource::collection com paginate retorna:
        // { data: [...], current_page, per_page, total, last_page, etc }
        produtos.value = data.data || [];
        
        // Atualizar informações de paginação
        paginacao.value.total = data.total || 0;
        paginacao.value.page = data.current_page || 1;
        paginacao.value.perPage = data.per_page || 10;
        paginacao.value.lastPage = data.last_page || 1;
        
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao carregar produtos', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };
    
    const onPageChange = (event) => {
      paginacao.value.page = event.page + 1; // PrimeVue usa índice 0, Laravel usa 1
      paginacao.value.perPage = event.rows;
      carregar();
    };
    
    const onSearchChange = () => {
      // Debounce: aguardar 500ms após o usuário parar de digitar
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
      
      searchTimeout = setTimeout(() => {
        paginacao.value.page = 1; // Resetar para primeira página ao buscar
        carregar();
      }, 500);
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
      modalImportacao.value.validacao = null;
    };

    const fecharModalImportacao = () => {
      modalImportacao.value.visivel = false;
      modalImportacao.value.arquivo = null;
      modalImportacao.value.resultado = null;
      modalImportacao.value.validacao = null;
    };

    const voltarParaSelecaoArquivo = () => {
      modalImportacao.value.validacao = null;
    };

    const analisarArquivo = async () => {
      if (!modalImportacao.value.arquivo) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um arquivo Excel', life: 3000 });
        return;
      }
      try {
        modalImportacao.value.analisando = true;
        modalImportacao.value.validacao = null;
        const response = await service.validarExcel(modalImportacao.value.arquivo);
        const data = response.data?.data || response.data;
        modalImportacao.value.validacao = {
          linhas: data.linhas || [],
          total_ok: data.total_ok ?? 0,
          total_erro: data.total_erro ?? 0,
          total_vazio: data.total_vazio ?? 0,
        };
        if (modalImportacao.value.validacao.total_erro === 0 && modalImportacao.value.validacao.total_ok > 0) {
          toast.add({ severity: 'success', summary: 'Análise concluída', detail: 'Nenhum erro encontrado. Você pode importar.', life: 4000 });
        } else if (modalImportacao.value.validacao.total_erro > 0) {
          toast.add({ severity: 'warn', summary: 'Análise concluída', detail: `${modalImportacao.value.validacao.total_erro} linha(s) com erro. Corrija o arquivo e analise novamente.`, life: 5000 });
        }
      } catch (error) {
        const msg = error.response?.data?.message || error.response?.data?.error || error.message || 'Erro ao analisar arquivo';
        toast.add({ severity: 'error', summary: 'Erro', detail: msg, life: 5000 });
      } finally {
        modalImportacao.value.analisando = false;
      }
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
        modalImportacao.value.validacao = null;

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
      carregando,
      paginacao,
      modalImportacao,
      toggleActive,
      abrirModalImportacao,
      fecharModalImportacao,
      voltarParaSelecaoArquivo,
      analisarArquivo,
      onFileSelect,
      baixarTemplate,
      processarImportacao,
      onPageChange,
      onSearchChange,
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

