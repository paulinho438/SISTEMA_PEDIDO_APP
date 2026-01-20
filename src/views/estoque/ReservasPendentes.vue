<template>
  <div class="card p-5 bg-page">
    <h5 class="text-900 mb-3">Análise de Reservas</h5>

    <div class="grid mb-3">
      <div class="col-12 md:col-4">
        <label for="filtroProduto">Produto</label>
        <InputText id="filtroProduto" v-model="filtros.search" placeholder="Buscar produto..." class="w-full" />
      </div>
      <div class="col-12 md:col-4">
        <label for="filtroLocal">Local</label>
        <Dropdown
          id="filtroLocal"
          v-model="filtros.location_id"
          :options="locais"
          optionLabel="name"
          optionValue="id"
          placeholder="Todos os locais"
          class="w-full"
          showClear
        />
      </div>
      <div class="col-12 md:col-4">
        <Button label="Atualizar" icon="pi pi-refresh" class="w-full mt-4" @click="carregar" />
      </div>
    </div>

    <DataTable
      :value="reservas"
      :paginator="true"
      :rows="10"
      dataKey="id"
      responsiveLayout="scroll"
      class="p-datatable-sm"
      :loading="carregando"
    >
      <Column field="product.description" header="Produto" sortable>
        <template #body="slotProps">
          <div>
            <div class="font-semibold">{{ slotProps.data.product?.description || '-' }}</div>
            <div class="text-sm text-500">{{ slotProps.data.product?.code || '' }}</div>
          </div>
        </template>
      </Column>
      <Column field="location.name" header="Local" sortable>
        <template #body="slotProps">
          {{ slotProps.data.location?.name || '-' }}
        </template>
      </Column>
      <Column field="quantity_reserved" header="Quantidade Reservada" sortable>
        <template #body="slotProps">
          <span class="font-semibold text-orange-600">{{ formatarQuantidade(slotProps.data.quantity_reserved) }}</span>
        </template>
      </Column>
      <Column field="quantity_available" header="Disponível" sortable>
        <template #body="slotProps">
          <span class="text-green-600">{{ formatarQuantidade(slotProps.data.quantity_available) }}</span>
        </template>
      </Column>
      <Column field="quantity_total" header="Total" sortable>
        <template #body="slotProps">
          {{ formatarQuantidade(slotProps.data.quantity_total) }}
        </template>
      </Column>
      <Column field="reservation_date" header="Data da Reserva" sortable>
        <template #body="slotProps">
          {{ slotProps.data.reservation_date || '-' }}
        </template>
      </Column>
      <Column field="reservation_user.name" header="Solicitante" sortable>
        <template #body="slotProps">
          {{ slotProps.data.reservation_user?.name || '-' }}
        </template>
      </Column>
      <Column header="Ações" headerStyle="width:20rem">
        <template #body="slotProps">
          <div class="flex gap-1 flex-wrap">
            <Button
              label="Dar Saída"
              icon="pi pi-check"
              class="p-button-sm p-button-success"
              @click="abrirModalSaida(slotProps.data)"
            />
            <Button
              label="Transferir e Sair"
              icon="pi pi-arrow-right-arrow-left"
              class="p-button-sm p-button-info"
              @click="abrirModalTransferirESair(slotProps.data)"
            />
            <Button
              label="Cancelar Reserva"
              icon="pi pi-times"
              class="p-button-sm p-button-danger"
              @click="abrirModalCancelarReserva(slotProps.data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Modal de Dar Saída -->
    <Dialog v-model:visible="modalSaida.visivel" header="Dar Saída do Produto" :modal="true" :style="{ width: '600px' }">
      <div class="grid">
        <div class="col-12">
          <div class="mb-2">
            <strong>Produto:</strong> {{ estoqueSelecionado?.product?.description }}
          </div>
          <div class="mb-2">
            <strong>Local:</strong> {{ estoqueSelecionado?.location?.name }}
          </div>
          <div class="mb-3">
            <strong>Reservado:</strong> <span class="text-orange-600">{{ formatarQuantidade(estoqueSelecionado?.quantity_reserved) }}</span>
          </div>
        </div>
        <div class="col-12">
          <label>Quantidade a Dar Saída *</label>
          <InputNumber
            v-model="formSaida.quantidade"
            :min="0.0001"
            :max="estoqueSelecionado?.quantity_reserved || 0"
            :step="0.0001"
            class="w-full"
            :useGrouping="false"
          />
          <small class="text-500">Máximo reservado: {{ formatarQuantidade(estoqueSelecionado?.quantity_reserved) }}</small>
        </div>
        <div class="col-12">
          <div class="flex align-items-center gap-2 mb-3">
            <Checkbox v-model="formSaida.criarAtivo" inputId="criarAtivo" :binary="true" />
            <label for="criarAtivo" class="cursor-pointer">Criar ativo ao dar saída</label>
          </div>
        </div>

        <!-- Formulário de Ativo (se criarAtivo estiver marcado) -->
        <template v-if="formSaida.criarAtivo">
          <div class="col-12">
            <Divider />
            <h6 class="mb-3">Dados do Ativo</h6>
          </div>
          <div class="col-12 md:col-6">
            <label>Filial</label>
            <Dropdown
              v-model="formSaida.assetData.branch_id"
              :options="filiais"
              optionLabel="name"
              optionValue="id"
              placeholder="Selecione"
              class="w-full"
              :filter="true"
              filterPlaceholder="Buscar filial"
              showClear
            >
              <template #empty>Nenhuma filial encontrada</template>
            </Dropdown>
          </div>
          <div class="col-12 md:col-6">
            <label>Local do Ativo</label>
            <Dropdown
              v-model="formSaida.assetData.location_id"
              :options="locais"
              optionLabel="name"
              optionValue="id"
              placeholder="Selecione"
              class="w-full"
              showClear
            />
          </div>
          <div class="col-12 md:col-6">
            <label>Responsável</label>
            <Dropdown
              v-model="formSaida.assetData.responsible_id"
              :options="usuarios || []"
              optionLabel="nome_completo"
              optionValue="id"
              placeholder="Selecione"
              class="w-full"
              showClear
            />
          </div>
          <div class="col-12 md:col-6">
            <label>Centro de Custo</label>
            <div class="p-inputgroup">
              <InputText
                :value="centroCustoLabel(formSaida.assetData.cost_center_selected)"
                placeholder="Selecione o centro de custo"
                readonly
                class="w-full"
              />
              <Button
                icon="pi pi-search"
                class="p-button-outlined"
                @click="abrirModalCentroCusto"
              />
              <Button
                v-if="formSaida.assetData.cost_center_selected"
                icon="pi pi-times"
                class="p-button-outlined p-button-danger"
                @click="limparCentroCusto"
              />
            </div>
          </div>
          <div class="col-12 md:col-6">
            <label>Valor (R$) *</label>
            <InputNumber
              v-model="formSaida.assetData.value_brl"
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              :min="0"
              class="w-full"
            />
          </div>
          <div class="col-12 md:col-6">
            <label>Data de Aquisição *</label>
            <Calendar
              v-model="formSaida.assetData.acquisition_date"
              dateFormat="yy-mm-dd"
              class="w-full"
              :showIcon="true"
            />
          </div>
          <div class="col-12">
            <label>Descrição do Ativo</label>
            <Textarea
              v-model="formSaida.assetData.description"
              class="w-full"
              rows="2"
              :placeholder="estoqueSelecionado?.product?.description || 'Descrição do ativo'"
            />
          </div>
        </template>

        <div class="col-12">
          <label>Observação</label>
          <Textarea v-model="formSaida.observacao" class="w-full" rows="3" placeholder="Informe observações sobre esta saída..." />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" class="p-button-outlined" @click="modalSaida.visivel = false" />
        <Button
          :label="formSaida.criarAtivo ? 'Dar Saída e Criar Ativo' : 'Confirmar Saída'"
          icon="pi pi-check"
          class="p-button-success"
          :loading="processando"
          :disabled="!formSaida.quantidade || formSaida.quantidade <= 0 || formSaida.quantidade > estoqueSelecionado?.quantity_reserved || (formSaida.criarAtivo && (!formSaida.assetData.value_brl || !formSaida.assetData.acquisition_date))"
          @click="confirmarSaida"
        />
      </template>
    </Dialog>

    <!-- Modal de Transferir e Sair -->
    <Dialog v-model:visible="modalTransferirESair.visivel" header="Transferir para Outro Local e Dar Saída" :modal="true" :style="{ width: '500px' }">
      <div class="grid">
        <div class="col-12">
          <div class="mb-2">
            <strong>Produto:</strong> {{ estoqueSelecionado?.product?.description }}
          </div>
          <div class="mb-2">
            <strong>Local de Origem:</strong> {{ estoqueSelecionado?.location?.name }}
          </div>
          <div class="mb-3">
            <strong>Reservado:</strong> <span class="text-orange-600">{{ formatarQuantidade(estoqueSelecionado?.quantity_reserved) }}</span>
          </div>
        </div>
        <div class="col-12">
          <label>Local de Destino *</label>
          <Dropdown
            v-model="formTransferirESair.localDestino"
            :options="locaisDestino"
            optionLabel="name"
            optionValue="id"
            placeholder="Selecione o local de destino"
            class="w-full"
            :filter="true"
          />
        </div>
        <div class="col-12">
          <label>Quantidade *</label>
          <InputNumber
            v-model="formTransferirESair.quantidade"
            :min="0.0001"
            :max="estoqueSelecionado?.quantity_reserved || 0"
            :step="0.0001"
            class="w-full"
            :useGrouping="false"
            :disabled="!formTransferirESair.localDestino"
          />
          <small class="text-500">Máximo reservado: {{ formatarQuantidade(estoqueSelecionado?.quantity_reserved) }}</small>
        </div>
        <div class="col-12">
          <label>Observação</label>
          <Textarea v-model="formTransferirESair.observacao" class="w-full" rows="3" placeholder="Informe observações sobre esta transferência e saída..." />
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" class="p-button-outlined" @click="modalTransferirESair.visivel = false" />
        <Button
          label="Transferir e Dar Saída"
          icon="pi pi-check"
          class="p-button-info"
          :loading="processando"
          :disabled="!formTransferirESair.localDestino || !formTransferirESair.quantidade || formTransferirESair.quantidade <= 0 || formTransferirESair.quantidade > estoqueSelecionado?.quantity_reserved || estoqueSelecionado?.stock_location_id === formTransferirESair.localDestino"
          @click="confirmarTransferirESair"
        />
      </template>
    </Dialog>

    <!-- Modal de Cancelar Reserva -->
    <Dialog v-model:visible="modalCancelarReserva.visivel" header="Cancelar Reserva" :modal="true" :style="{ width: '600px' }">
      <div class="grid">
        <div class="col-12">
          <div class="mb-2">
            <strong>Produto:</strong> {{ estoqueSelecionado?.product?.description }}
          </div>
          <div class="mb-2">
            <strong>Local:</strong> {{ estoqueSelecionado?.location?.name }}
          </div>
          <div class="mb-3">
            <strong>Reservado:</strong> <span class="text-orange-600">{{ formatarQuantidade(estoqueSelecionado?.quantity_reserved) }}</span>
          </div>
        </div>
        <div class="col-12">
          <label>Quantidade a Cancelar *</label>
          <InputNumber
            v-model="formCancelarReserva.quantidade"
            :min="0.0001"
            :max="estoqueSelecionado?.quantity_reserved || 0"
            :step="0.0001"
            class="w-full"
            :useGrouping="false"
          />
          <small class="text-500">Máximo reservado: {{ formatarQuantidade(estoqueSelecionado?.quantity_reserved) }}</small>
        </div>
        <div class="col-12">
          <label>Motivo do Cancelamento *</label>
          <Textarea
            v-model="formCancelarReserva.motivo"
            class="w-full"
            rows="4"
            placeholder="Informe o motivo do cancelamento da reserva. Ex: Produto não está mais disponível no estoque, solicitante deve pedir em outro local ou seguir com solicitação de compra..."
            :maxlength="500"
          />
          <small class="text-500">Mínimo de 10 caracteres. Máximo de 500 caracteres.</small>
        </div>
      </div>
      <template #footer>
        <Button label="Cancelar" class="p-button-outlined" @click="modalCancelarReserva.visivel = false" />
        <Button
          label="Confirmar Cancelamento"
          icon="pi pi-times"
          class="p-button-danger"
          :loading="processando"
          :disabled="!formCancelarReserva.quantidade || formCancelarReserva.quantidade <= 0 || formCancelarReserva.quantidade > estoqueSelecionado?.quantity_reserved || !formCancelarReserva.motivo || formCancelarReserva.motivo.length < 10"
          @click="confirmarCancelarReserva"
        />
      </template>
    </Dialog>

    <!-- Modal de Centro de Custo -->
    <Dialog v-model:visible="modalCentroCusto.visivel" modal header="Selecionar centro de custo" :style="{ width: '50vw', maxWidth: '800px' }" appendTo="body">
      <div class="mb-3">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <InputText v-model="modalCentroCusto.busca" placeholder="Buscar (código, descrição...)" class="w-full" @input="onPesquisarCentroCusto" />
        </span>
      </div>

      <DataTable
        :value="modalCentroCusto.items"
        selectionMode="single"
        v-model:selection="modalCentroCusto.selection"
        :loading="modalCentroCusto.loading"
        dataKey="CTT_CUSTO"
        paginator
        :rows="modalCentroCusto.perPage"
        :totalRecords="modalCentroCusto.total"
        :rowsPerPageOptions="[10, 20, 50]"
        lazy
        :first="(modalCentroCusto.page - 1) * modalCentroCusto.perPage"
        @page="onCentroCustoPage"
        class="p-datatable-sm"
        responsiveLayout="scroll"
      >
        <Column selectionMode="single" headerStyle="width:3rem"></Column>
        <Column field="CTT_CUSTO" header="Código" sortable />
        <Column field="CTT_DESC01" header="Descrição" sortable />
        <Column field="CTT_CLASSE" header="Classe" sortable />
      </DataTable>

      <template #footer>
        <div class="flex justify-content-end mt-3">
          <Button label="Cancelar" class="p-button-text" @click="fecharModalCentroCusto" />
          <Button label="Selecionar" class="p-button-success" @click="confirmarCentroCusto" :disabled="!modalCentroCusto.selection" />
        </div>
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import StockService from '@/service/StockService';
import StockLocationService from '@/service/StockLocationService';
import AssetAuxiliaryService from '@/service/AssetAuxiliaryService';
import UserService from '@/service/UserService';
import ProtheusService from '@/service/ProtheusService';

export default {
  name: 'ReservasPendentes',
  setup() {
    const toast = useToast();
    const reservas = ref([]);
    const locais = ref([]);
    const carregando = ref(false);
    const processando = ref(false);
    const estoqueSelecionado = ref(null);

    const stockService = new StockService();
    const locationService = new StockLocationService();

    const filiais = ref([]);
    const usuarios = ref([]);
    const centrosCusto = ref([]);
    const carregandoAuxiliares = ref(false);

    const filtros = ref({
      search: '',
      location_id: null,
    });

    const modalSaida = reactive({
      visivel: false,
    });

    const modalTransferirESair = reactive({
      visivel: false,
    });

    const modalCancelarReserva = reactive({
      visivel: false,
    });

    const formSaida = ref({
      quantidade: null,
      observacao: '',
      criarAtivo: false,
      assetData: {
        branch_id: null,
        location_id: null,
        responsible_id: null,
        cost_center_id: null,
        cost_center_selected: null,
        value_brl: 0,
        acquisition_date: new Date(),
        description: '',
      },
    });

    const modalCentroCusto = reactive({
      visivel: false,
      busca: '',
      selection: null,
      items: [],
      page: 1,
      perPage: 10,
      total: 0,
      loading: false,
      lastPage: 1
    });

    let buscaCentroTimeout = null;

    const formTransferirESair = ref({
      localDestino: null,
      quantidade: null,
      observacao: '',
    });

    const formCancelarReserva = ref({
      quantidade: null,
      motivo: '',
    });

    const locaisDestino = computed(() => {
      if (!estoqueSelecionado.value) return locais.value;
      return locais.value.filter(l => l.id !== estoqueSelecionado.value.stock_location_id);
    });

    const formatarQuantidade = (qtd) => {
      return qtd ? parseFloat(qtd).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : '0,0000';
    };

    const carregar = async () => {
      try {
        carregando.value = true;
        const params = {
          ...filtros.value,
          has_reserved: true,
          per_page: 100,
        };
        const { data } = await stockService.getAll(params);
        reservas.value = data.data || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar reservas', life: 3000 });
      } finally {
        carregando.value = false;
      }
    };

    const carregarLocais = async () => {
      try {
        const { data } = await locationService.getAll({ per_page: 100 });
        locais.value = data.data || [];
      } catch (error) {
        console.error('Erro ao carregar locais:', error);
      }
    };

    const carregarDadosAuxiliares = async () => {
      try {
        carregandoAuxiliares.value = true;
        
        const [filiaisRes, usuariosRes, centrosRes] = await Promise.all([
          new AssetAuxiliaryService('filiais').getAll({ all: true }),
          new UserService().getAll(),
          new ProtheusService().getCentrosCusto({ per_page: 100 }),
        ]);

        // Resposta da API: { "data": [...] }
        // Axios retorna: response.data = { "data": [...] }
        // Então: filiaisRes.data.data é o array de filiais

        console.log('Debug filiais ', filiaisRes.data);  

        
        // Extrair array de filiais
        // Resposta: { "data": [...] }
        // Axios: response.data = { "data": [...] }
        let filiaisArray = [];
        
        if (filiaisRes?.data?.data && Array.isArray(filiaisRes.data.data)) {
          filiaisArray = [...filiaisRes.data.data]; // Criar nova referência
        } else if (Array.isArray(filiaisRes?.data)) {
          filiaisArray = [...filiaisRes.data]; // Criar nova referência
        }
        
        // Atribuir usando spread para garantir reatividade
        filiais.value = filiaisArray;
        
        console.log('=== DEBUG FILIAIS ===');
        console.log('filiaisRes completo:', filiaisRes);
        console.log('filiaisRes.data:', filiaisRes?.data);
        console.log('filiaisRes.data.data:', filiaisRes?.data?.data);
        console.log('Filiais extraídas (array):', filiaisArray);
        console.log('Filiais extraídas (ref):', filiais.value);
        console.log('Tamanho:', filiais.value.length);
        console.log('Primeiro item:', filiais.value[0]);
        console.log('Tipo:', typeof filiais.value);
        console.log('É array?', Array.isArray(filiais.value));
        
        // Extrair usuários da resposta - mesma lógica das filiais
        let usuariosArray = [];
        
        if (usuariosRes?.data?.data && Array.isArray(usuariosRes.data.data)) {
          usuariosArray = [...usuariosRes.data.data];
        } else if (Array.isArray(usuariosRes?.data)) {
          usuariosArray = [...usuariosRes.data];
        }
        
        usuarios.value = usuariosArray;
        
        console.log('=== DEBUG USUÁRIOS ===');
        console.log('usuariosRes:', usuariosRes);
        console.log('usuariosRes.data:', usuariosRes?.data);
        console.log('usuariosRes.data.data:', usuariosRes?.data?.data);
        console.log('Usuários processados:', usuarios.value.length, usuarios.value);
        
        // Centros de custo agora são buscados via modal paginado, não precisamos carregar todos aqui
        centrosCusto.value = [];
        
        if (filiais.value.length === 0) {
          console.warn('Nenhuma filial encontrada. Verifique se há filiais cadastradas.');
          console.log('Resposta da API:', filiaisRes);
        }
      } catch (error) {
        console.error('Erro ao carregar dados auxiliares:', error);
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao carregar dados auxiliares.',
          life: 3000
        });
      } finally {
        carregandoAuxiliares.value = false;
      }
    };

    const abrirModalSaida = async (estoque) => {
      estoqueSelecionado.value = estoque;
      formSaida.value = {
        quantidade: estoque.quantity_reserved,
        observacao: '',
        criarAtivo: false,
        assetData: {
          branch_id: null,
          location_id: estoque.stock_location_id || null,
          responsible_id: null,
          cost_center_id: null,
          cost_center_selected: null,
          value_brl: 0,
          acquisition_date: new Date(),
          description: estoque.product?.description || '',
        },
      };
      
      // Garantir que os dados auxiliares estejam carregados antes de abrir o modal
      if (filiais.value.length === 0 || usuarios.value.length === 0) {
        await carregarDadosAuxiliares();
      }
      
      // Verificar se os dados foram carregados
      console.log('Ao abrir modal - Filiais disponíveis:', filiais.value.length, filiais.value);
      
      modalSaida.visivel = true;
    };

    const confirmarSaida = async () => {
      if (!formSaida.value.quantidade || formSaida.value.quantidade <= 0) {
        return;
      }

      try {
        processando.value = true;

        if (formSaida.value.criarAtivo) {
          // Dar saída e criar ativo
          const assetData = { ...formSaida.value.assetData };
          if (assetData.acquisition_date instanceof Date) {
            assetData.acquisition_date = assetData.acquisition_date.toISOString().split('T')[0];
          }

          const dados = {
            quantity: formSaida.value.quantidade,
            observation: formSaida.value.observacao || null,
            asset_data: assetData,
          };

          const response = await stockService.darSaidaECriarAtivo(estoqueSelecionado.value.id, dados);

          toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: `Saída realizada e ativo ${response.data?.data?.asset?.asset_number || ''} criado com sucesso!`,
            life: 4000
          });
        } else {
          // Apenas dar saída
          const dados = {
            quantity: formSaida.value.quantidade,
            observation: formSaida.value.observacao || null,
          };

          await stockService.darSaida(estoqueSelecionado.value.id, dados);

          toast.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Saída realizada com sucesso!',
            life: 3000
          });
        }

        modalSaida.visivel = false;
        await carregar();
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao dar saída do produto',
          life: 3000
        });
      } finally {
        processando.value = false;
      }
    };

    const abrirModalTransferirESair = (estoque) => {
      estoqueSelecionado.value = estoque;
      formTransferirESair.value = {
        localDestino: null,
        quantidade: estoque.quantity_reserved,
        observacao: '',
      };
      modalTransferirESair.visivel = true;
    };

    const confirmarTransferirESair = async () => {
      if (!formTransferirESair.value.localDestino || !formTransferirESair.value.quantidade) {
        return;
      }

      if (estoqueSelecionado.value.stock_location_id === formTransferirESair.value.localDestino) {
        toast.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'O local de origem e destino devem ser diferentes.',
          life: 3000
        });
        return;
      }

      try {
        processando.value = true;

        const dados = {
          to_location_id: formTransferirESair.value.localDestino,
          quantity: formTransferirESair.value.quantidade,
          observation: formTransferirESair.value.observacao || null,
        };

        await stockService.transferirESair(estoqueSelecionado.value.id, dados);

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Transferência e saída realizadas com sucesso!',
          life: 3000
        });

        modalTransferirESair.visivel = false;
        await carregar();
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || 'Erro ao transferir e dar saída',
          life: 3000
        });
      } finally {
        processando.value = false;
      }
    };

    const abrirModalCancelarReserva = (estoque) => {
      estoqueSelecionado.value = estoque;
      formCancelarReserva.value = {
        quantidade: estoque.quantity_reserved,
        motivo: '',
      };
      modalCancelarReserva.visivel = true;
    };

    const confirmarCancelarReserva = async () => {
      if (!formCancelarReserva.value.quantidade || formCancelarReserva.value.quantidade <= 0) {
        return;
      }

      if (!formCancelarReserva.value.motivo || formCancelarReserva.value.motivo.length < 10) {
        toast.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'O motivo do cancelamento deve ter no mínimo 10 caracteres.',
          life: 3000
        });
        return;
      }

      if (formCancelarReserva.value.quantidade > estoqueSelecionado.value.quantity_reserved) {
        toast.add({
          severity: 'warn',
          summary: 'Aviso',
          detail: 'A quantidade a cancelar não pode ser maior que a quantidade reservada.',
          life: 3000
        });
        return;
      }

      try {
        processando.value = true;

        const dados = {
          quantity: formCancelarReserva.value.quantidade,
          motivo: formCancelarReserva.value.motivo.trim(),
        };

        await stockService.cancelarReserva(estoqueSelecionado.value.id, dados);

        toast.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Reserva cancelada com sucesso! A quantidade foi liberada e está disponível novamente.',
          life: 4000
        });

        modalCancelarReserva.visivel = false;
        await carregar();
      } catch (error) {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.response?.data?.message || error.response?.data?.error || 'Erro ao cancelar reserva',
          life: 3000
        });
      } finally {
        processando.value = false;
      }
    };

    const fetchCentrosCusto = async () => {
      try {
        modalCentroCusto.loading = true;

        const params = {
          page: modalCentroCusto.page,
          per_page: modalCentroCusto.perPage
        };

        const busca = modalCentroCusto.busca.trim();
        if (busca) {
          params.busca = busca;
        }

        const response = await new ProtheusService().getCentrosCusto(params);
        const payload = response?.data ?? {};
        const data = payload?.data ?? payload;

        modalCentroCusto.items = data?.items ?? data?.centros ?? [];

        const pagination = data?.pagination ?? payload?.pagination ?? {};

        modalCentroCusto.total = pagination?.total ?? data?.total ?? modalCentroCusto.items.length;
        modalCentroCusto.page = pagination?.current_page ?? params.page ?? 1;
        modalCentroCusto.perPage = pagination?.per_page ?? params.per_page ?? modalCentroCusto.perPage;
        modalCentroCusto.lastPage = pagination?.last_page ?? Math.max(1, Math.ceil((modalCentroCusto.total || 0) / modalCentroCusto.perPage));
      } catch (error) {
        console.error('Erro ao buscar centros de custo do Protheus', error);
        toast.add({
          severity: 'error',
          summary: 'Erro ao carregar centros de custo',
          detail: error?.response?.data?.message || 'Não foi possível obter os centros de custo do Protheus.',
          life: 4000
        });
        modalCentroCusto.items = [];
      } finally {
        modalCentroCusto.loading = false;
      }
    };

    const abrirModalCentroCusto = () => {
      modalCentroCusto.visivel = true;
      modalCentroCusto.page = 1;
      modalCentroCusto.busca = '';
      modalCentroCusto.selection = formSaida.value.assetData.cost_center_selected ? { ...formSaida.value.assetData.cost_center_selected } : null;
      fetchCentrosCusto();
    };

    const fecharModalCentroCusto = () => {
      modalCentroCusto.visivel = false;
      modalCentroCusto.selection = null;
    };

    const onPesquisarCentroCusto = () => {
      if (buscaCentroTimeout) {
        clearTimeout(buscaCentroTimeout);
      }
      buscaCentroTimeout = setTimeout(() => {
        modalCentroCusto.page = 1;
        fetchCentrosCusto();
      }, 400);
    };

    const onCentroCustoPage = event => {
      modalCentroCusto.page = event.page + 1;
      modalCentroCusto.perPage = event.rows;
      fetchCentrosCusto();
    };

    const confirmarCentroCusto = () => {
      if (!modalCentroCusto.selection) {
        return;
      }

      formSaida.value.assetData.cost_center_selected = { ...modalCentroCusto.selection };
      formSaida.value.assetData.cost_center_id = modalCentroCusto.selection.CTT_CUSTO || modalCentroCusto.selection.id || modalCentroCusto.selection.codigo;

      toast.add({
        severity: 'success',
        summary: 'Centro de custo selecionado',
        detail: modalCentroCusto.selection.CTT_DESC01 || modalCentroCusto.selection.CTT_CUSTO,
        life: 2000
      });

      fecharModalCentroCusto();
    };

    const limparCentroCusto = () => {
      formSaida.value.assetData.cost_center_selected = null;
      formSaida.value.assetData.cost_center_id = null;
    };

    const centroCustoLabel = centro => {
      if (!centro) return '';

      const codigo = centro.CTT_CUSTO ?? centro.id ?? centro.codigo ?? '';
      const descricao = centro.CTT_DESC01 ?? centro.description ?? centro.descricao ?? '';

      if (codigo && descricao) {
        return `${codigo} - ${descricao}`;
      }

      return codigo || descricao;
    };

    watch([() => filtros.value.search, () => filtros.value.location_id], () => {
      carregar();
    }, { debounce: 500 });

    onMounted(() => {
      carregar();
      carregarLocais();
      carregarDadosAuxiliares();
    });

    return {
      reservas,
      locais,
      locaisDestino,
      filtros,
      carregando,
      processando,
      estoqueSelecionado,
      modalSaida,
      modalTransferirESair,
      modalCancelarReserva,
      formSaida,
      formTransferirESair,
      formCancelarReserva,
      formatarQuantidade,
      carregar,
      abrirModalSaida,
      confirmarSaida,
      abrirModalTransferirESair,
      confirmarTransferirESair,
      abrirModalCancelarReserva,
      confirmarCancelarReserva,
      filiais,
      usuarios,
      centrosCusto,
      carregandoAuxiliares,
      modalCentroCusto,
      centroCustoLabel,
      abrirModalCentroCusto,
      fecharModalCentroCusto,
      onPesquisarCentroCusto,
      onCentroCustoPage,
      confirmarCentroCusto,
      limparCentroCusto,
    };
  },
};
</script>

