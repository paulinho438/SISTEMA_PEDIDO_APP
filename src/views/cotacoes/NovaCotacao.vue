<template>
  <div class="card p-4">
    <Toast />
    <!-- Header -->
    <div class="flex justify-content-between align-items-center mb-3">
      <div class="flex align-items-center gap-2">
        <Button icon="pi pi-arrow-left" class="p-button-text" />
        <h5 class="m-0">Nova Cotação</h5>
        <Button
            icon="pi pi-comments"
            class="p-button-rounded p-button-text"
            :badge="mensagens.length ? String(mensagens.length) : undefined"
            badgeClass="p-badge-info"
            @click="abrirMensagens"
            :title="mensagens.length ? 'Ver mensagens da cotação' : 'Sem mensagens registradas'"
        />
      </div>
      <div class="flex gap-2 align-items-center">
    <Button
        label="Imprimir Cotação"
        icon="pi pi-print"
        class="p-button-info"
        :loading="imprimindoCotacao"
        :disabled="imprimindoCotacao || !route.params.id"
        @click="imprimirCotacao"
    />
    <Button
        label="Selecionar Itens"
        class="p-button-outlined p-button-secondary"
        :disabled="cotacoes.length === 0 || isReadOnly"
        @click="abrirSelecionarItens"
    />
    <Button
        label="Salvar"
        icon="pi pi-save"
        class="p-button-success"
        :loading="salvandoCotacao"
        :disabled="salvandoCotacao || finalizandoCotacao || isReadOnly"
        @click="salvarCotacao"
    />
    <div class="flex gap-2">
      <template v-if="approvalAction.type === 'finalize'">
        <Button
            label="Finalizar Cotação"
            icon="pi pi-check"
            class="p-button-secondary"
            :loading="finalizandoCotacao"
            :disabled="finalizandoCotacao || salvandoCotacao"
            @click="handleFinalizarClick"
        />
      </template>
      <template v-else-if="approvalAction.type === 'options'">
        <Button
            label="Analisar"
            icon="pi pi-check"
            class="p-button-success"
            :loading="analisandoCotacao"
            :disabled="analisandoCotacao"
            @click="abrirModalAnalise('analisada')"
        />
      </template>
      <template v-else-if="approvalAction.type === 'single'">
        <Button
            :label="approvalAction.buttonLabel"
            :icon="approvalAction.icon"
            :class="approvalAction.buttonClass"
            :loading="analisandoCotacao"
            :disabled="analisandoCotacao"
            @click="abrirAnaliseDireta(approvalAction)"
        />
      </template>
      <Button
          v-if="canReprove"
          label="Reprovar"
          icon="pi pi-times"
          class="p-button-danger"
          :loading="reprovandoCotacao"
          :disabled="reprovandoCotacao"
          @click="abrirModalReprovar"
      />
      <Button label="Cancelar" icon="pi pi-times" class="p-button-danger" />
    </div>
      </div>
    </div>

    <!-- Integração Protheus -->
    <!-- Botão adicionar fornecedor -->
    <!-- Mostrar se pode editar OU se é o comprador responsável e o status permite adicionar fornecedores -->
    <Button
        v-if="podeAdicionarFornecedor"
        label="+ Fornecedor"
        class="p-button-outlined p-button-success mb-3"
        @click="addCotacao"
    />

    <!-- Tabela principal -->
    <div class="overflow-auto">
      <table class="tabela-cotacao">
        <thead>
        <tr>
          <th rowspan="2">N°</th>
          <th rowspan="2">Qtd</th>
          <th rowspan="2">Descrição do Produto</th>
          <template v-for="(cot, i) in cotacoes" :key="'cab-' + i">
            <th colspan="7" class="text-center bg-fornecedor">
              <div class="flex justify-content-between align-items-center mb-2">
                <strong>Cotação {{ i + 1 }}</strong>
                <Button
                    v-if="!isReadOnly"
                    icon="pi pi-trash"
                    class="p-button-text p-button-danger p-button-sm"
                    @click="removeCotacao(i)"
                />
              </div>
              <div class="grid p-fluid text-sm">
                <div class="col-12">
                  <div class="p-inputgroup fornecedor-input">
                    <InputText
                        :value="fornecedorLabel(cot.fornecedor)"
                        placeholder="Selecione um fornecedor"
                        readonly
                        class="w-full"
                    />
                    <Button
                        icon="pi pi-search"
                        label="Selecionar"
                        class="p-button-outlined"
                        :disabled="isReadOnly"
                        @click="abrirModalFornecedores(i)"
                    />
                    <Button
                        v-if="cot.fornecedor && !isReadOnly"
                        icon="pi pi-times"
                        class="p-button-outlined p-button-danger"
                        @click="limparFornecedor(i)"
                    />
                  </div>
                </div>
                <div class="col-12"><InputText v-model="cot.vendedor" placeholder="Vendedor" :disabled="isReadOnly" /></div>
                <div class="col-12"><InputText v-model="cot.telefone" placeholder="Telefone" :disabled="isReadOnly" /></div>
                <div class="col-12"><InputText v-model="cot.email" placeholder="Email" :disabled="isReadOnly" /></div>
                <div class="col-12"><InputText v-model="cot.proposta" placeholder="N° Proposta" :disabled="isReadOnly" /></div>
                <div class="col-12">
                  <label class="font-medium text-700 mb-2 block">Condição de pagamento</label>
                  <AutoComplete
                      v-model="cot.condicaoPagamento"
                      :suggestions="condicoesPagamentoSugestoes"
                      field="label"
                      :dropdown="true"
                      :forceSelection="false"
                      :disabled="isReadOnly"
                      :loading="condicoesPagamentoLoading"
                      placeholder="Selecione a condição"
                      @complete="buscarCondicoesPagamento"
                      class="w-full"
                  />
                </div>
                <div class="col-12">
                  <label class="font-medium text-700 mb-2 block">Tipo de frete</label>
                  <Dropdown
                      v-model="cot.tipoFrete"
                      :options="tiposFrete"
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Selecione o tipo de frete"
                      class="w-full"
                      :disabled="isReadOnly"
                      showClear
                  />
                </div>
              </div>
            </th>
          </template>
        </tr>

        <tr>
          <template v-for="(cot, i) in cotacoes" :key="'sub-' + i">
            <th>Marca</th>
            <th>Custo Unit.</th>
            <th>IPI</th>
            <th>Custo C/ IPI /S Difal</th>
            <th>ICMS</th>
            <th>ICMS Custo total</th>
            <th>Custo C/ IPI /C Difal</th>
          </template>
        </tr>
        </thead>

        <tbody>
        <tr v-for="(prod, p) in produtos" :key="'row-' + p">
          <td>{{ prod.id }}</td>
          <td>{{ prod.qtd }}</td>
          <td>{{ prod.descricao }}</td>

          <template v-for="(cot, i) in cotacoes" :key="'linha-' + i + '-' + p">
            <td>
              <InputText
                  v-model="cot.itens[p].marca"
                  placeholder="Marca"
                  class="w-full p-inputtext-sm"
                  :class="isMelhorPreco(cot, p, i)"
                  :disabled="isReadOnly"
              />
            </td>
            <td>
              <InputText
                  v-model="cot.itens[p].custoUnit"
                  placeholder="R$ 0,00"
                  class="w-full p-inputtext-sm text-right"
                  :class="isMelhorPreco(cot, p, i)"
                  style="min-width: 120px !important;"
                  @focus="prepararCampoMoeda(i, p, 'custoUnit')"
                  @blur="formatarCampoMoeda(i, p, 'custoUnit')"
                  :disabled="isReadOnly"
              />
            </td>
            <td>
              <InputText
                  v-model="cot.itens[p].ipi"
                  placeholder="0%"
                  class="w-full p-inputtext-sm text-center"
                  :class="isMelhorPreco(cot, p, i)"
                  :disabled="isReadOnly"
              />
            </td>
            <td>
              <InputText
                  v-model="cot.itens[p].custoIPI"
                  placeholder="R$ 0,00"
                  class="w-full p-inputtext-sm text-right"
                  :class="isMelhorPreco(cot, p, i)"
                  @focus="prepararCampoMoeda(i, p, 'custoIPI')"
                  @blur="formatarCampoMoeda(i, p, 'custoIPI')"
                  :disabled="isReadOnly"
              />
            </td>
            <td>
              <InputText
                  v-model="cot.itens[p].icms"
                  placeholder="0%"
                  class="w-full p-inputtext-sm text-center"
                  :class="isMelhorPreco(cot, p, i)"
                  :disabled="isReadOnly"
              />
            </td>
            <td>
              <InputText
                  v-model="cot.itens[p].icmsTotal"
                  placeholder="R$ 0,00"
                  class="w-full p-inputtext-sm text-right"
                  :class="isMelhorPreco(cot, p, i)"
                  @focus="prepararCampoMoeda(i, p, 'icmsTotal')"
                  @blur="formatarCampoMoeda(i, p, 'icmsTotal')"
                  :disabled="isReadOnly"
              />
            </td>
            <td>
              <InputText
                  v-model="cot.itens[p].custoFinal"
                  placeholder="R$ 0,00"
                  class="w-full p-inputtext-sm text-right"
                  :class="isMelhorPreco(cot, p, i)"
                  @focus="prepararCampoMoeda(i, p, 'custoFinal')"
                  @blur="formatarCampoMoeda(i, p, 'custoFinal')"
                  :disabled="isReadOnly"
              />
            </td>
          </template>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- QUADRO RESUMO -->
    <div v-if="resumo.length" class="quadro-resumo mt-6">
        <h4 class="text-center mb-3 font-semibold">Quadro resumo da cotação e compra</h4>
        <table class="tabela-cotacao">
          <thead>
          <tr>
            <th>N°</th>
            <th>Descrição</th>
            <th>Fornecedor ganhador</th>
            <th>Valor Unitário</th>
            <th>Quantidade</th>
            <th>Total</th>
            <th>Motivo</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(r, index) in resumo" :key="'res-' + index">
            <td>{{ index + 1 }}</td>
            <td>{{ r.produto }}</td>
            <td>{{ r.fornecedor }}</td>
            <td>{{ formatCurrencyValue(r.valorUnit) }}</td>
            <td>{{ r.qtd }}</td>
            <td>{{ formatCurrencyValue(r.total) }}</td>
            <td>{{ r.motivo || '-' }}</td>
          </tr>
          <tr class="bg-surface-100 font-semibold">
            <td colspan="5" class="text-right">Total geral:</td>
            <td>{{ formatCurrencyValue(totalGeral) }}</td>
            <td></td>
          </tr>
          </tbody>
        </table>
        
        <!-- Seção de Assinaturas -->
        <div class="mt-5 pt-4 border-top-1 border-300">
          <h5 class="text-center mb-4 font-semibold">Assinaturas</h5>
          <div class="grid">
            <div class="col-12 md:col-2" v-for="(assinatura, perfil) in assinaturasOrdenadas" :key="perfil">
              <div class="text-center p-3 border-round" style="border: 1px solid #e5e7eb;">
                <div class="font-medium text-sm mb-2">{{ perfil }}</div>
                <div v-if="assinatura && assinatura.signature_url" class="signature-container">
                  <img 
                    :src="assinatura.signature_url" 
                    :alt="`Assinatura ${perfil}`"
                    class="signature-image"
                    style="max-width: 100%; max-height: 80px; object-fit: contain;"
                  />
                  <div class="text-xs text-500 mt-1">{{ assinatura.user_name }}</div>
                </div>
                <div v-else class="text-400 text-sm">
                  <i class="pi pi-image" style="font-size: 2rem;"></i>
                  <div class="mt-2">Sem assinatura</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    <Dialog
        v-model:visible="modalFornecedores.visible"
        header="Selecionar fornecedor"
        :style="{ width: '60vw', maxWidth: '900px' }"
        :baseZIndex="2100"
        appendTo="body"
        modal
    >
      <div class="p-input-icon-left mb-3 w-full">
        <i class="pi pi-search" />
        <InputText
            v-model="modalFornecedores.search"
            placeholder="Buscar (nome ou CNPJ)"
            class="w-full"
            @input="onSearchFornecedores"
        />
      </div>

      <DataTable
          :value="fornecedoresState.items"
          dataKey="A2_COD"
          :loading="fornecedoresState.loading"
          :rows="fornecedoresState.perPage"
          :totalRecords="fornecedoresState.total"
          :paginator="true"
          :rowsPerPageOptions="[10, 20, 50]"
          lazy
          :first="(fornecedoresState.page - 1) * fornecedoresState.perPage"
          @page="onFornecedoresPage"
          v-model:selection="modalFornecedores.selected"
          selectionMode="single"
          class="p-datatable-sm"
      >
        <Column selectionMode="single" headerStyle="width:3rem"></Column>
        <Column field="A2_COD" header="Código" sortable></Column>
        <Column field="A2_NOME" header="Fornecedor" sortable></Column>
        <Column field="A2_CGC" header="CNPJ" sortable></Column>
      </DataTable>

      <template #footer>
        <Button
            label="Cancelar"
            icon="pi pi-times"
            class="p-button-text"
            @click="modalFornecedores.visible = false"
        />
        <Button
            label="Selecionar"
            icon="pi pi-check"
            class="p-button-success"
            :disabled="!modalFornecedores.selected"
            @click="confirmarFornecedorSelecionado"
        />
      </template>
    </Dialog>

    <Dialog
        v-model:visible="showModalSelecionar"
        header="Selecionar fornecedor ganhador"
        :style="{ width: '70vw', maxWidth: '900px' }"
        :baseZIndex="2000"
        appendTo="body"
        modal
    >
      <div class="space-y-5" style="display: flex; flex-direction: column; gap: 20px;">
        <div
            v-for="(prod, p) in produtos"
            :key="'sel-' + p"
            class="produto-card surface-card border-round-lg p-4 shadow-1"
        >
          <div class="flex justify-content-between align-items-center mb-3">
            <h5 class="m-0 font-semibold text-lg text-900">
              {{ prod.descricao }}
            </h5>
            <span class="text-sm text-500">Qtd: {{ prod.qtd }}</span>
          </div>

          <div class="grid formgrid">
            <div
                v-for="(cot, i) in cotacoes"
                :key="'opt-' + p + '-' + i"
                class="col-12 md:col-4"
            >
              <div
                  class="fornecedor-card border-1 border-round p-3 cursor-pointer transition-all"
                  :class="{
              'fornecedor-selecionado': selecoes[p] === i,
              'fornecedor-padrao': selecoes[p] !== i
            }"
                  @click="selecoes[p] = i"
              >
                <div class="flex align-items-center gap-2 mb-2">
                  <RadioButton
                      v-model="selecoes[p]"
                      :inputId="'opt' + p + i"
                      :value="i"
                      :name="`sel-${p}`"
                  />
                  <label :for="'opt' + p + i" class="font-semibold text-800 text-sm">
                    {{ fornecedorNome(cot, i) }}
                  </label>
                </div>

                <div class="text-sm text-700">
                  <i class="pi pi-dollar mr-1 text-green-600"></i>
                  Valor: <strong>R$ {{ cot.itens[p].custoUnit || '0,00' }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div
              v-if="selecoes[p] !== menorIndice(p)"
              class="mt-3 transition-all"
          >
            <label class="block mb-2 text-sm text-700 font-semibold"
            >Motivo da escolha manual:</label
            >
            <Textarea
                v-model="motivos[p]"
                rows="2"
                class="w-full border-round"
                placeholder="Ex: Produto com melhor qualidade ou menor prazo de entrega..."
            />
          </div>
        </div>
      </div>

      <template #footer>
        <Button
            label="Cancelar"
            icon="pi pi-times"
            class="p-button-text"
            @click="showModalSelecionar = false"
        />
        <Button
            label="Confirmar"
            icon="pi pi-check"
            class="p-button-success"
            @click="confirmarSelecoes"
        />
      </template>
    </Dialog>

    <Dialog
        v-model:visible="modalMensagens"
        header="Mensagens da cotação"
        :style="{ width: '40vw', maxWidth: '600px' }"
        :baseZIndex="2300"
        appendTo="body"
        modal
    >
      <div v-if="mensagens.length" class="mensagens-container">
        <div
            v-for="(msg, index) in mensagens"
            :key="msg.id"
            class="mensagem-bubble"
            :class="bubbleClasse(msg.tipo, index)"
        >
          <div class="flex justify-content-between text-700 mb-1">
            <span class="font-medium">{{ msg.autor }}</span>
            <small>{{ msg.data }}</small>
  </div>
          <div class="text-800 white-space-pre-line">{{ msg.mensagem }}</div>
        </div>
      </div>
      <div v-else class="text-center text-600 py-4">
        Nenhuma mensagem registrada até o momento.
      </div>
    </Dialog>

    <Dialog
        v-model:visible="modalFinalizar"
        header="Responder ajustes"
        :style="{ width: '35vw', maxWidth: '520px' }"
        :baseZIndex="2400"
        appendTo="body"
        modal
    >
      <p class="text-700 mb-3">
        Esta cotação possui pendências apontadas pelo comprador. Informe abaixo o que foi ajustado antes de finalizar.
      </p>
      <div
          v-if="ultimaMensagemReprova"
          class="mensagem-bubble reprova esquerda mb-3"
      >
        <div class="flex justify-content-between text-700 mb-1">
          <span class="font-medium">{{ ultimaMensagemReprova.autor }}</span>
          <small>{{ ultimaMensagemReprova.data }}</small>
        </div>
        <div class="text-800 white-space-pre-line">{{ ultimaMensagemReprova.mensagem }}</div>
      </div>
      <Textarea
          v-model="mensagemFinalizar"
          rows="4"
          class="w-full"
          placeholder="Descreva os ajustes realizados..."
      />
      <template #footer>
        <Button label="Cancelar" class="p-button-text" @click="modalFinalizar = false" />
        <Button
            label="Finalizar"
            icon="pi pi-check"
            class="p-button-success"
            :loading="finalizandoCotacao"
            :disabled="!mensagemFinalizar.trim() || finalizandoCotacao"
            @click="confirmarFinalizarCotacao"
        />
      </template>
    </Dialog>

    <Dialog
        v-model:visible="modalReprovar"
        header="Reprovar cotação"
        :style="{ width: '35vw', maxWidth: '520px' }"
        :baseZIndex="2400"
        appendTo="body"
        modal
    >
      <p class="text-700 mb-3">Descreva o motivo da reprovação. Essa mensagem será enviada ao comprador.</p>
      <div v-if="mensagensResumoReprova.length" class="mensagens-container mb-3">
        <div
            v-for="mensagem in mensagensResumoReprova"
            :key="`resumo-${mensagem.id}`"
            class="mensagem-bubble"
            :class="classeResumoMensagem(mensagem)"
        >
          <div class="flex justify-content-between text-700 mb-1">
            <span class="font-medium">{{ mensagem.autor }}</span>
            <small>{{ mensagem.data }}</small>
          </div>
          <div class="text-800 white-space-pre-line">{{ mensagem.mensagem }}</div>
        </div>
      </div>
      <Textarea
          v-model="mensagemReprova"
          rows="4"
          class="w-full"
          placeholder="Informe os ajustes necessários..."
      />
      <template #footer>
        <Button label="Cancelar" class="p-button-text" @click="modalReprovar = false" />
        <Button
            label="Enviar"
            icon="pi pi-send"
            class="p-button-danger"
            :loading="reprovandoCotacao"
            :disabled="!mensagemReprova.trim() || reprovandoCotacao"
            @click="confirmarReprovar"
        />
      </template>
    </Dialog>

    <Dialog
        v-model:visible="modalAnalise"
        header="Confirmar análise"
        :style="{ width: '35vw', maxWidth: '520px' }"
        :baseZIndex="2400"
        appendTo="body"
        modal
        @hide="resetAnaliseModal"
    >
      <div v-if="analiseModo === 'options'" class="mb-3">
        <label class="font-medium text-700 mb-2 block">Selecione o status</label>
        <div class="flex align-items-center gap-4">
          <div class="flex align-items-center gap-2">
            <RadioButton
                inputId="analise-status-analisada"
                value="analisada"
                v-model="statusAnaliseSelecionado"
            />
            <label for="analise-status-analisada" class="cursor-pointer">Analisada</label>
          </div>
          <div class="flex align-items-center gap-2">
            <RadioButton
                inputId="analise-status-analisada-aguardando"
                value="analisada_aguardando"
                v-model="statusAnaliseSelecionado"
            />
            <label for="analise-status-analisada-aguardando" class="cursor-pointer">Analisada / Aguardando</label>
          </div>
        </div>
      </div>
      <div v-else class="mb-3">
        <p class="text-700 white-space-pre-line">{{ analiseDescricao }}</p>
      </div>
      <div>
        <label class="font-medium text-700 mb-2 block">Observação (opcional)</label>
        <Textarea
            v-model="observacaoAnalise"
            rows="3"
            class="w-full"
            placeholder="Escreva uma observação para o histórico, se necessário."
        />
      </div>
      <template #footer>
        <Button label="Cancelar" class="p-button-text" @click="fecharModalAnalise" />
        <Button
            label="Confirmar"
            icon="pi pi-check"
            class="p-button-success"
            :loading="analisandoCotacao"
            :disabled="analisandoCotacao"
            @click="confirmarAnalise"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useStore } from 'vuex'
import ProtheusService from '@/service/ProtheusService'
import SolicitacaoService from '@/service/SolicitacaoService'
import UsuarioService from '@/service/UsuarioService'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import RadioButton from 'primevue/radiobutton'
import Toast from 'primevue/toast'

document.title = 'Nova Cotação'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = useStore()
const protheusService = new ProtheusService()
const usuarioService = new UsuarioService()

const produtos = ref([])
const cotacoes = ref([])
const showModalSelecionar = ref(false)
const selecoes = ref({})
const motivos = ref({})
const salvandoCotacao = ref(false)
const imprimindoCotacao = ref(false)
const fornecedoresState = reactive({
  items: [],
  page: 1,
  perPage: 20,
  total: 0,
  loading: false,
})
const modalFornecedores = reactive({
  visible: false,
  search: '',
  selected: null,
  targetIndex: null,
})
const cotacao = reactive({
  id: null,
  numero: '',
  solicitacao: '',
  solicitante: '',
  empresa: '',
  local: '',
  companyId: null,
  itensOriginais: [],
  status: null,
  requires_response: false,
  permissions: {
    can_edit: false,
    can_approve: false,
    next_pending_level: null,
  },
  buyer: null,
})
const condicoesPagamentoSugestoes = ref([])
const condicoesPagamentoLoading = ref(false)
const tiposFrete = [
  { label: 'CIF (C)', value: 'C' },
  { label: 'FOB (F)', value: 'F' },
  { label: 'Terceiros (T)', value: 'T' },
  { label: 'Sem frete (S)', value: 'S' },
]
const finalizandoCotacao = ref(false)
const analisandoCotacao = ref(false)
const reprovandoCotacao = ref(false)
const mensagens = ref([])
const modalMensagens = ref(false)
const modalFinalizar = ref(false)
const modalReprovar = ref(false)
const modalAnalise = ref(false)
const analiseModo = ref('options')
const analiseDescricao = ref('')
const mensagemFinalizar = ref('')
const mensagemReprova = ref('')
const statusAnaliseSelecionado = ref('analisada')
const observacaoAnalise = ref('')
const assinaturas = ref({})
const assinaturasLoading = ref(false)
const mensagensReprova = computed(() =>
  mensagens.value
    .filter((mensagem) => mensagem.tipo === 'reprova')
    .sort((a, b) => new Date(a.data_iso) - new Date(b.data_iso))
)
const mensagensComprador = computed(() =>
  mensagens.value
    .filter((mensagem) => mensagem.tipo === 'response')
    .sort((a, b) => new Date(a.data_iso) - new Date(b.data_iso))
)
const ultimaMensagemComprador = computed(() =>
  mensagensComprador.value.length ? mensagensComprador.value[mensagensComprador.value.length - 1] : null
)
const ultimaMensagemReprova = computed(() =>
  mensagensReprova.value.length ? mensagensReprova.value[mensagensReprova.value.length - 1] : null
)
const mensagensResumoReprova = computed(() => {
  const colecao = []

  if (ultimaMensagemReprova.value) {
    colecao.push(ultimaMensagemReprova.value)
  }

  if (ultimaMensagemComprador.value) {
    colecao.push(ultimaMensagemComprador.value)
  }

  return colecao.sort((a, b) => new Date(a.data_iso) - new Date(b.data_iso))
})
const bubbleClasse = (tipo, index = 0) => {
  if (tipo === 'response') return 'resposta direita'
  if (tipo === 'reprova') return index % 2 === 0 ? 'reprova esquerda' : 'reprova direita'
  return 'geral'
}
const classeResumoMensagem = (mensagem) => {
  if (mensagem.tipo === 'response') return 'resposta direita'
  if (mensagem.tipo === 'reprova') return 'reprova destaque'
  return 'geral'
}

const approvalTransitions = {
  finalizada: ['analisada', 'analisada_aguardando'],
  analisada: ['analise_gerencia'],
  analisada_aguardando: ['analise_gerencia'],
  analise_gerencia: ['aprovado'],
}

const readOnlyStatuses = ['finalizada', 'analisada', 'analisada_aguardando', 'analise_gerencia', 'aprovado']
// isReadOnly: não pode editar se o status está em readOnlyStatuses OU se não tem permissão para editar
// Mas o comprador responsável pode editar mesmo quando can_edit é false, se o status permitir
const isReadOnly = computed(() => {
  // Se o status está na lista de read-only, sempre read-only
  if (readOnlyStatuses.includes(cotacao.status?.slug)) {
    return true
  }
  
  // Se tem permissão para editar, não é read-only
  if (cotacao.permissions && cotacao.permissions.can_edit) {
    return false
  }
  
  // Se não tem permissão para editar, verificar se é o comprador responsável e o status permite
  const usuario = store.state.usuario
  if (!usuario) {
    return true
  }
  
  // Se não há buyer_id ainda (ainda não foi atribuída), qualquer um pode editar
  if (!cotacao.buyer || !cotacao.buyer.id) {
    return false
  }
  
  // Verificar se o usuário é o comprador responsável
  const buyerId = Number(cotacao.buyer.id)
  const usuarioId = Number(usuario.id)
  const isBuyer = buyerId === usuarioId
  
  // Status que permitem edição pelo comprador responsável
  const statusPermitidos = ['cotacao', 'compra_em_andamento', 'autorizado']
  const statusAtual = cotacao.status?.slug
  
  // Se é o comprador responsável e o status permite, pode editar
  return !(isBuyer && statusPermitidos.includes(statusAtual))
})
const availableTransitions = computed(() => approvalTransitions[cotacao.status?.slug] ?? [])
// canReprove: só pode reprovar se pode aprovar (tem permissão para aprovar)
const canReprove = computed(() => {
  // Se não pode aprovar, não pode reprovar
  if (cotacao.permissions && !cotacao.permissions.can_approve) {
    return false
  }
  // Só pode reprovar em status específicos
  return ['finalizada', 'analisada', 'analisada_aguardando', 'analise_gerencia', 'aprovado'].includes(cotacao.status?.slug)
})

const singleActionMetadata = {
  analise_gerencia: {
    buttonLabel: 'Encaminhar para Gerência',
    buttonClass: 'p-button-info',
    icon: 'pi pi-arrow-right',
    description: 'Encaminhar a cotação para análise da gerência.',
  },
  aprovado: {
    buttonLabel: 'Aprovar Cotação',
    buttonClass: 'p-button-success',
    icon: 'pi pi-check',
    description: 'Aprovar a cotação e concluir o fluxo de aprovação.',
  },
}

// Verificar se o usuário é Gerente Local ou Gerente Geral (podem escolher status)
const isManager = computed(() => {
  const usuario = store.state.usuario
  if (!usuario || !usuario.permissions || !Array.isArray(usuario.permissions)) {
    return false
  }
  
  // Verificar se o usuário tem grupo/permissão de Gerente Local ou Gerente Geral
  for (const perm of usuario.permissions) {
    if (perm.permissions && Array.isArray(perm.permissions)) {
      const groupName = perm.name?.toLowerCase() || ''
      if (groupName.includes('gerente local') || groupName.includes('gerente geral')) {
        return true
      }
    }
  }
  return false
})

// Verificar se pode adicionar fornecedor
// O comprador responsável pode adicionar fornecedores mesmo quando não pode editar completamente
const podeAdicionarFornecedor = computed(() => {
  // Se pode editar, pode adicionar fornecedor
  if (cotacao.permissions && cotacao.permissions.can_edit) {
    return true
  }
  
  // Se não pode editar, verificar se é o comprador responsável e o status permite
  const usuario = store.state.usuario
  if (!usuario) {
    return false
  }
  
  // Se não há buyer_id ainda (ainda não foi atribuída), qualquer um pode adicionar fornecedor
  if (!cotacao.buyer || !cotacao.buyer.id) {
    return true
  }
  
  // Verificar se o usuário é o comprador responsável
  // Converter ambos para Number para garantir comparação correta
  const buyerId = Number(cotacao.buyer.id)
  const usuarioId = Number(usuario.id)
  const isBuyer = buyerId === usuarioId
  
  // Status que NÃO permitem adicionar fornecedores (status finais)
  const statusBloqueados = ['finalizada', 'analisada', 'analisada_aguardando', 'analise_gerencia', 'aprovado']
  const statusAtual = cotacao.status?.slug
  
  // Debug temporário (remover depois)
  if (process.env.NODE_ENV === 'development') {
    console.log('podeAdicionarFornecedor:', {
      can_edit: cotacao.permissions?.can_edit,
      buyerId,
      usuarioId,
      isBuyer,
      statusAtual,
      statusBloqueado: statusBloqueados.includes(statusAtual),
      resultado: isBuyer && !statusBloqueados.includes(statusAtual)
    })
  }
  
  // Se é o comprador responsável e o status não está bloqueado, pode adicionar fornecedor
  return isBuyer && !statusBloqueados.includes(statusAtual)
})

const approvalAction = computed(() => {
  const slug = cotacao.status?.slug

  // "Finalizar Cotação" é uma ação de mudança de status, não de aprovação
  // O comprador responsável sempre deve poder finalizar quando o status é compra_em_andamento
  if (slug === 'compra_em_andamento') {
    // Verificar se o usuário é o comprador responsável
    const usuario = store.state.usuario
    const isBuyer = cotacao.buyer && usuario && Number(cotacao.buyer.id) === Number(usuario.id)
    
    // Se for o comprador responsável, permitir finalizar
    if (isBuyer) {
      return { type: 'finalize' }
    }
  }

  // Status "finalizada" é um caso especial: gerentes podem analisar mesmo sem aprovações pendentes
  // Isso permite que gerentes locais/gerais analisem cotações finalizadas independentemente de can_approve
  if (slug === 'finalizada') {
    // Apenas Gerente Local ou Gerente Geral podem escolher entre "Analisada" e "Analisada / Aguardando"
    // Outros perfis (como Engenheiro) devem aprovar diretamente
    if (isManager.value) {
      return { type: 'options' }
    } else {
      // Para outros perfis, aprovar diretamente para "analisada"
      // Mas só se tiver permissão can_approve
      if (cotacao.permissions && !cotacao.permissions.can_approve) {
        return { type: 'none' }
      }
      return {
        type: 'single',
        targetStatus: 'analisada',
        buttonLabel: 'Analisar',
        buttonClass: 'p-button-success',
        icon: 'pi pi-check',
        description: 'Analisar a cotação.',
      }
    }
  }

  // Para outras ações, verificar se o usuário pode aprovar
  if (cotacao.permissions && !cotacao.permissions.can_approve) {
    return { type: 'none' }
  }

  const transitions = availableTransitions.value

  if (transitions.length === 1) {
    const targetStatus = transitions[0]
    const meta = singleActionMetadata[targetStatus] ?? {}

    return {
      type: 'single',
      targetStatus,
      buttonLabel: meta.buttonLabel ?? 'Avançar aprovação',
      buttonClass: meta.buttonClass ?? 'p-button-success',
      icon: meta.icon ?? 'pi pi-check',
      description: meta.description ?? 'Avance para a próxima etapa da aprovação.',
    }
  }

  return { type: 'none' }
})

const parsePreco = (valor) => {
  if (valor === null || valor === undefined || valor === '') {
    return null
  }

  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : null
  }

  let texto = String(valor)
    .replace(/\s/g, '')
    .replace(/R\$/gi, '')

  if (texto.includes(',')) {
    texto = texto.replace(/\./g, '').replace(/,/g, '.')
  }

  const numero = Number(texto)

  return Number.isFinite(numero) ? numero : null
}

const formatCurrencyValue = (valor) => {
  const numero = parsePreco(valor)
  if (numero === null) {
    return ''
  }

  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

const formatNumberValue = (valor) => {
  const numero = parsePreco(valor)
  if (numero === null) {
    return ''
  }

  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const criarItensCotacao = () => {
  // Garantir que todos os itens sejam criados baseado em produtos.value
  // Se não houver itensOriginais, criar baseado no número de produtos
  const totalItens = cotacao.itensOriginais?.length ?? produtos.value.length
  
  return Array.from({ length: totalItens }, (_, index) => ({
    marca: null,
    custoUnit: null,
    ipi: null,
    custoIPI: null,
    icms: null,
    icmsTotal: null,
    custoFinal: null,
    itemId: cotacao.itensOriginais?.[index]?.id ?? produtos.value[index]?.id ?? null,
  }))
}

const addCotacao = () => {
  // Debug temporário
  if (process.env.NODE_ENV === 'development') {
    console.log('addCotacao chamado:', {
      podeAdicionarFornecedor: podeAdicionarFornecedor.value,
      isReadOnly: isReadOnly.value,
      can_edit: cotacao.permissions?.can_edit,
      buyer: cotacao.buyer,
      usuario: store.state.usuario,
    })
  }
  
  // Usar a mesma lógica de podeAdicionarFornecedor ao invés de isReadOnly
  if (!podeAdicionarFornecedor.value) {
    toast.add({
      severity: 'warn',
      summary: 'Ação não permitida',
      detail: 'Você não tem permissão para adicionar fornecedores nesta cotação.',
      life: 3000,
    })
    return
  }
  
  // Garantir que todos os itens sejam criados baseado em produtos.value
  const novosItens = criarItensCotacao()
  
  // Debug temporário
  if (process.env.NODE_ENV === 'development') {
    console.log('Adicionando fornecedor:', {
      produtosCount: produtos.value.length,
      itensCriados: novosItens.length,
      itensOriginaisCount: cotacao.itensOriginais?.length ?? 0,
    })
  }
  
  // Garantir que o número de itens seja igual ao número de produtos
  if (novosItens.length !== produtos.value.length) {
    console.warn('Número de itens criados não corresponde ao número de produtos:', {
      produtos: produtos.value.length,
      itens: novosItens.length,
    })
  }
  
  cotacoes.value.push({
    fornecedor: null,
    codigo: null,
    nome: null,
    cnpj: null,
    vendedor: '',
    telefone: '',
    email: '',
    proposta: '',
    condicaoPagamento: null,
    tipoFrete: null,
    itens: novosItens,
  })
  
  // Debug temporário
  if (process.env.NODE_ENV === 'development') {
    console.log('Fornecedor adicionado. Total de fornecedores:', cotacoes.value.length)
  }
}

const removeCotacao = (index) => {
  if (isReadOnly.value) {
    return
  }
  cotacoes.value.splice(index, 1)

  Object.keys(selecoes.value).forEach((key) => {
    if (selecoes.value[key] === index) {
      delete selecoes.value[key]
    } else if (selecoes.value[key] > index) {
      selecoes.value[key] -= 1
    }
  })
}

const fornecedorLabel = (fornecedor) => {
  if (!fornecedor) return ''
  const codigo = fornecedor.A2_COD ? `(${fornecedor.A2_COD})` : ''
  const nome = fornecedor.A2_NOME ?? ''
  const cnpj = fornecedor.A2_CGC ? ` - ${fornecedor.A2_CGC}` : ''
  return `${nome}${cnpj} ${codigo}`.trim()
}

let fornecedoresSearchTimeout = null

const mapFornecedoresResponse = (response) => {
  const root = response?.data ?? {}
  const payload = root.data ?? root
  const items = payload.items ?? payload.data ?? []
  const pagination = root.pagination ?? payload.pagination ?? payload.meta ?? {}

  return {
    items,
    total: pagination.total ?? payload.total ?? items.length,
    perPage: pagination.per_page ?? pagination.perPage ?? payload.per_page ?? fornecedoresState.perPage,
    page: pagination.current_page ?? pagination.currentPage ?? payload.current_page ?? fornecedoresState.page,
  }
}

const buscarFornecedores = async () => {
  try {
    fornecedoresState.loading = true
    const response = await protheusService.getFornecedores(
      {
        page: fornecedoresState.page,
        per_page: fornecedoresState.perPage,
        busca: modalFornecedores.search || undefined,
      },
      cotacao.companyId ? { headers: { 'company-id': cotacao.companyId } } : {}
    )
    const resultado = mapFornecedoresResponse(response)
    fornecedoresState.items = resultado.items
    fornecedoresState.total = resultado.total
    fornecedoresState.perPage = resultado.perPage
    fornecedoresState.page = resultado.page
  } catch (error) {
    console.error('Erro ao buscar fornecedores do Protheus', error)
    toast.add({
      severity: 'error',
      summary: 'Erro ao carregar fornecedores',
      detail: error?.response?.data?.message || 'Não foi possível obter fornecedores do Protheus.',
      life: 4000,
    })
  } finally {
    fornecedoresState.loading = false
  }
}

const onSearchFornecedores = () => {
  if (fornecedoresSearchTimeout) {
    clearTimeout(fornecedoresSearchTimeout)
  }

  fornecedoresSearchTimeout = setTimeout(async () => {
    fornecedoresState.page = 1
    await buscarFornecedores()
  }, 400)
}

const onFornecedoresPage = async ({ page, rows }) => {
  fornecedoresState.page = (page ?? 0) + 1
  fornecedoresState.perPage = rows ?? fornecedoresState.perPage
  await buscarFornecedores()
}

const protheusRequestConfig = computed(() =>
  cotacao.companyId ? { headers: { 'company-id': cotacao.companyId } } : {}
)

const extrairItensProtheus = (response) => {
  const root = response?.data ?? {}
  const payload = root.data ?? root
  const dados = payload.items ?? payload.data ?? []
  if (Array.isArray(dados)) {
    return dados
  }

  return Object.values(dados)
}

const toCondicaoPagamentoOption = (item) => {
  const codigo = item?.E4_CODIGO ?? item?.codigo ?? ''
  const descricao = item?.E4_DESCRI ?? item?.descricao ?? ''

  return {
    codigo,
    descricao,
    label: [codigo, descricao].filter(Boolean).join(' - '),
  }
}

const buscarCondicoesPagamento = async ({ query } = {}) => {
  condicoesPagamentoLoading.value = true
  try {
    const response = await protheusService.getCondicoesPagamento(
      {
        per_page: 20,
        descricao: query || undefined,
      },
      protheusRequestConfig.value
    )
    condicoesPagamentoSugestoes.value = extrairItensProtheus(response).map(toCondicaoPagamentoOption)
  } catch (error) {
    console.error('Erro ao consultar condições de pagamento no Protheus', error)
    toast.add({
      severity: 'error',
      summary: 'Erro ao consultar condições de pagamento',
      detail: error?.response?.data?.message || 'Não foi possível consultar as condições de pagamento no Protheus.',
      life: 4000,
    })
  } finally {
    condicoesPagamentoLoading.value = false
  }
}

const abrirModalFornecedores = async (index) => {
  if (isReadOnly.value) {
    return
  }
  modalFornecedores.targetIndex = index
  modalFornecedores.selected = cotacoes.value[index]?.fornecedor ?? null
  fornecedoresState.page = 1
  modalFornecedores.visible = true

  await buscarFornecedores()
}

const confirmarFornecedorSelecionado = () => {
  if (
    modalFornecedores.targetIndex === null ||
    modalFornecedores.targetIndex === undefined ||
    !modalFornecedores.selected
  ) {
    modalFornecedores.visible = false
    return
  }

  const index = modalFornecedores.targetIndex
  if (cotacoes.value[index]) {
    const fornecedor = modalFornecedores.selected
    cotacoes.value[index].fornecedor = fornecedor
    cotacoes.value[index].codigo = fornecedor?.A2_COD ?? null
    cotacoes.value[index].nome = fornecedor?.A2_NOME ?? null
    cotacoes.value[index].cnpj = fornecedor?.A2_CGC ?? null
  }

  modalFornecedores.visible = false
}

const limparFornecedor = (index) => {
  if (isReadOnly.value) {
    return
  }
  if (cotacoes.value[index]) {
    cotacoes.value[index].fornecedor = null
    cotacoes.value[index].codigo = null
    cotacoes.value[index].nome = null
    cotacoes.value[index].cnpj = null
    cotacoes.value[index].condicaoPagamento = null
    cotacoes.value[index].tipoFrete = null
  }
}

const prepararCampoMoeda = (cotIndex, itemIndex, campo) => {
  if (isReadOnly.value) {
    return
  }
  const item = cotacoes.value[cotIndex]?.itens?.[itemIndex]
  if (!item) return

  const numero = parsePreco(item[campo])
  item[campo] = numero === null ? '' : formatNumberValue(numero)
}

const formatarCampoMoeda = (cotIndex, itemIndex, campo) => {
  const item = cotacoes.value[cotIndex]?.itens?.[itemIndex]
  if (!item) return

  const numero = parsePreco(item[campo])
  item[campo] = numero === null ? '' : formatCurrencyValue(numero)
}

const menorIndice = (itemIndex) => {
  let menorValor = Number.POSITIVE_INFINITY
  let indiceMenor = null

  cotacoes.value.forEach((cot, idx) => {
    const valor = parsePreco(cot?.itens?.[itemIndex]?.custoUnit)
    if (valor !== null && valor < menorValor) {
      menorValor = valor
      indiceMenor = idx
    }
  })

  return indiceMenor
}

const isMelhorPreco = (cot, itemIndex, cotIndex) => {
  const menor = menorIndice(itemIndex)
  if (menor === null) {
    return ''
  }

  if (menor === cotIndex) {
    return 'melhor-preco'
  }

  if (selecoes.value[itemIndex] === cotIndex && menor !== cotIndex) {
    return 'selecionado-manual'
  }

  return ''
}

const fornecedorNome = (cot, index) =>
  cot?.fornecedor?.A2_NOME || cot?.nome || `Fornecedor ${index + 1}`

const carregarCotacao = async () => {
  try {
    if (!route.params.id) {
      toast.add({
        severity: 'warn',
        summary: 'Selecione uma solicitação',
        detail: 'Escolha uma solicitação antes de iniciar a cotação.',
        life: 3500,
      })
      router.push({ name: 'cotacoesList' })
      return
    }

    const { data } = await SolicitacaoService.show(route.params.id)
    const detalhe = data?.data ?? {}

    cotacao.id = detalhe.id
    cotacao.numero = detalhe.numero
    cotacao.solicitante = detalhe.solicitante
    cotacao.empresa = detalhe.empresa
    cotacao.local = detalhe.local
    cotacao.solicitacao = detalhe.solicitacao ?? detalhe.numero
    cotacao.companyId = detalhe.company_id ?? null
    cotacao.itensOriginais = detalhe.itens || []
    cotacao.status = detalhe.status ?? null
    cotacao.requires_response = detalhe.requires_response ?? false
    cotacao.permissions = detalhe.permissions ?? { can_edit: false, can_approve: false, next_pending_level: null }
    cotacao.buyer = detalhe.buyer ?? null
    mensagens.value = detalhe.mensagens ?? []

    // Se houver mensagens, abrir o modal automaticamente
    if (mensagens.value && mensagens.value.length > 0) {
      modalMensagens.value = true
    }

    produtos.value = cotacao.itensOriginais.map((item, index) => ({
      id: item.id || index + 1,
      qtd: item.quantidade,
      descricao: item.mercadoria,
    }))

    const cotacoesSalvas = detalhe.cotacoes ?? []

    cotacoes.value = cotacoesSalvas.map((cot) => {
      const fornecedorInfo = {
        A2_COD: cot.codigo ?? null,
        A2_NOME: cot.nome ?? '',
        A2_CGC: cot.cnpj ?? null,
      }

      const itens = cotacao.itensOriginais.map((itemOrigem) => {
        const itemSalvo = (cot.itens ?? []).find((it) => it.item_id === itemOrigem.id) ?? {}
        return {
          id: itemSalvo.id ?? null,
          itemId: itemOrigem.id,
          marca: itemSalvo.marca ?? null,
          custoUnit: formatCurrencyValue(itemSalvo.custo_unit),
          ipi: formatNumberValue(itemSalvo.ipi),
          custoIPI: formatCurrencyValue(itemSalvo.custo_ipi),
          icms: formatNumberValue(itemSalvo.icms),
          icmsTotal: formatCurrencyValue(itemSalvo.icms_total),
          custoFinal: formatCurrencyValue(itemSalvo.custo_final),
        }
      })

      return {
        id: cot.id ?? null,
        fornecedor: fornecedorInfo.A2_COD || fornecedorInfo.A2_NOME ? fornecedorInfo : null,
        codigo: cot.codigo ?? null,
        nome: cot.nome ?? null,
        cnpj: cot.cnpj ?? null,
        vendedor: cot.vendedor ?? '',
        telefone: cot.telefone ?? '',
        email: cot.email ?? '',
        proposta: cot.proposta ?? '',
        condicaoPagamento: cot.condicao_pagamento
          ? {
              codigo: cot.condicao_pagamento.codigo,
              descricao: cot.condicao_pagamento.descricao,
              label: [cot.condicao_pagamento.codigo, cot.condicao_pagamento.descricao]
                .filter(Boolean)
                .join(' - '),
            }
          : null,
        tipoFrete: cot.tipo_frete ?? null,
        itens,
      }
    })

    motivos.value = {}
    selecoes.value = {}

    const selecoesSalvas = detalhe.selecoes ?? []
    selecoesSalvas.forEach((selecao) => {
      const itemIndex = cotacao.itensOriginais.findIndex((item) => item.id === selecao.item_id)
      if (itemIndex < 0) {
        return
      }

      let fornecedorIndex = cotacoes.value.findIndex((cot) => cot.id && cot.id === selecao.supplier_id)
      if (fornecedorIndex < 0 && selecao.supplier_codigo) {
        fornecedorIndex = cotacoes.value.findIndex((cot) => {
          const codigo = cot.fornecedor?.A2_COD ?? cot.codigo
          return codigo === selecao.supplier_codigo
        })
      }

      if (fornecedorIndex < 0) {
        return
      }

      selecoes.value[itemIndex] = fornecedorIndex
      if (selecao.motivo) {
        motivos.value[itemIndex] = selecao.motivo
      }

      const cot = cotacoes.value[fornecedorIndex]
      const itemCotacao = cot?.itens?.[itemIndex]
      if (itemCotacao) {
        if (selecao.valor_unitario !== null && selecao.valor_unitario !== undefined) {
          itemCotacao.custoUnit = formatCurrencyValue(selecao.valor_unitario)
        }
        if (selecao.valor_total !== null && selecao.valor_total !== undefined) {
          itemCotacao.custoFinal = formatCurrencyValue(selecao.valor_total)
        }
      }
    })
  } catch (error) {
    const detail = error?.response?.data?.message || 'Não foi possível carregar a cotação.'
    toast.add({ severity: 'error', summary: 'Erro', detail, life: 4000 })
    router.push({ name: 'cotacoesList' })
  }
}

const carregarTodosDados = async () => {
  await carregarCotacao()
  if (route.params.id) {
    await buscarFornecedores()
  }
  await buscarCondicoesPagamento()
}

const abrirSelecionarItens = () => {
  if (isReadOnly.value) {
    return
  }
  if (!cotacoes.value.length) {
    toast.add({
      severity: 'warn',
      summary: 'Nenhuma cotação adicionada',
      detail: 'Adicione ao menos um fornecedor para selecionar os ganhadores.',
      life: 3000,
    })
    return
  }

  showModalSelecionar.value = true
}

const confirmarSelecoes = () => {
  showModalSelecionar.value = false
}

const salvarCotacao = async (options = {}) => {
  const { skipSuccessToast = false, showReadOnlyWarning = true } = options ?? {}

  if (!cotacao.id) {
    toast.add({
      severity: 'error',
      summary: 'Cotação não encontrada',
      detail: 'Não foi possível identificar a cotação para salvar.',
      life: 4000,
    })
    return false
  }

  const fornecedoresPreparados = []

  cotacoes.value.forEach((cot, index) => {
    const nomeFornecedor = cot.fornecedor?.A2_NOME ?? cot.nome
    if (!nomeFornecedor) {
      return
    }

    const payloadFornecedor = {
      id: cot.id ?? null,
      codigo: cot.fornecedor?.A2_COD ?? cot.codigo ?? null,
      nome: nomeFornecedor,
      cnpj: cot.fornecedor?.A2_CGC ?? cot.cnpj ?? null,
      vendedor: cot.vendedor || null,
      telefone: cot.telefone || null,
      email: cot.email || null,
      proposta: cot.proposta || null,
      condicao_pagamento: cot.condicaoPagamento
        ? {
            codigo: cot.condicaoPagamento.codigo,
            descricao: cot.condicaoPagamento.descricao,
          }
        : null,
      tipo_frete: cot.tipoFrete || null,
      itens: cot.itens.map((item, idx) => {
        const itemOrigem = cotacao.itensOriginais[idx]
        return {
          id: item.id ?? null,
          item_id: item.itemId ?? itemOrigem?.id ?? null,
          marca: item.marca || null,
          custo_unit: parsePreco(item.custoUnit),
          ipi: parsePreco(item.ipi),
          custo_ipi: parsePreco(item.custoIPI),
          icms: parsePreco(item.icms),
          icms_total: parsePreco(item.icmsTotal),
          custo_final: parsePreco(item.custoFinal),
        }
      }),
    }

    fornecedoresPreparados.push({
      originalIndex: index,
      payload: payloadFornecedor,
    })
  })

  if (!fornecedoresPreparados.length) {
    if (showReadOnlyWarning) {
      toast.add({
        severity: 'warn',
        summary: 'Informe os fornecedores',
        detail: 'Adicione ao menos um fornecedor com proposta antes de salvar.',
        life: 3500,
      })
    }
    return false
  }

  const selecoesPayload = cotacao.itensOriginais
    .map((itemOrigem, itemIndex) => {
      let fornecedorIndex = selecoes.value[itemIndex]
      if (fornecedorIndex === undefined || fornecedorIndex === null) {
        fornecedorIndex = menorIndice(itemIndex)
      }

      if (fornecedorIndex === undefined || fornecedorIndex === null) {
        return null
      }

      const fornecedorEncontrado = fornecedoresPreparados.find(
        (item) => item.originalIndex === fornecedorIndex
      )

      if (!fornecedorEncontrado) {
        return null
      }

      const cot = cotacoes.value[fornecedorIndex]
      const itemCotacao = cot?.itens?.[itemIndex]

      const quantidade = parsePreco(itemOrigem.quantidade) ?? parsePreco(produtos.value[itemIndex]?.qtd) ?? 0
      const valorUnit = parsePreco(itemCotacao?.custoUnit ?? itemCotacao?.custoFinal)
      const valorTotal =
        parsePreco(itemCotacao?.custoFinal) ??
        (valorUnit !== null && valorUnit !== undefined ? valorUnit * (quantidade || 0) : null)

      return {
        item_id: itemOrigem.id,
        supplier_id: cot?.id ?? null,
        supplier_codigo: fornecedorEncontrado.payload.codigo ?? null,
        valor_unitario: valorUnit,
        valor_total: valorTotal,
        motivo: motivos.value[itemIndex] || null,
      }
    })
    .filter(Boolean)

  const corpoRequisicao = {
    fornecedores: fornecedoresPreparados.map((item) => item.payload),
    selecoes: selecoesPayload,
  }

  try {
    salvandoCotacao.value = true
    await SolicitacaoService.saveDetails(cotacao.id, corpoRequisicao)

    if (!skipSuccessToast) {
      toast.add({
        severity: 'success',
        summary: 'Cotação salva',
        detail: 'As informações foram atualizadas.',
        life: 4000,
      })
    }

    await carregarCotacao()
    // Recarregar assinaturas após salvar (a aprovação do COMPRADOR é feita automaticamente)
    await carregarAssinaturas()
    return true
  } catch (error) {
    const detail = error?.response?.data?.message || 'Não foi possível salvar a cotação.'
    toast.add({
      severity: 'error',
      summary: 'Erro ao salvar',
      detail,
      life: 4000,
    })
    return false
  } finally {
    salvandoCotacao.value = false
  }
}

const handleFinalizarClick = () => {
  if (cotacao.requires_response) {
    mensagemFinalizar.value = ''
    modalFinalizar.value = true
    return
  }

  finalizarCotacao()
}

const confirmarFinalizarCotacao = async () => {
  const sucesso = await finalizarCotacao(mensagemFinalizar.value)
  if (sucesso) {
    modalFinalizar.value = false
    mensagemFinalizar.value = ''
  }
}

const finalizarCotacao = async (mensagem = '') => {
  if (finalizandoCotacao.value || salvandoCotacao.value) {
    return false
  }

  const salvou = await salvarCotacao({ skipSuccessToast: true, showReadOnlyWarning: false })
  if (!salvou) {
    return false
  }

  const mensagemNormalizada = (mensagem ?? '').trim()

  try {
    finalizandoCotacao.value = true
    await SolicitacaoService.finalize(
      cotacao.id,
      mensagemNormalizada ? { mensagem: mensagemNormalizada } : {}
    )

    toast.add({
      severity: 'success',
      summary: 'Cotação finalizada',
      detail: 'Status atualizado para Finalizada.',
      life: 4000,
    })

    await carregarCotacao()
    router.push({ name: 'cotacoesList' })
    return true
  } catch (error) {
    const detail = error?.response?.data?.message || 'Não foi possível finalizar a cotação.'
    toast.add({
      severity: 'error',
      summary: 'Erro ao finalizar',
      detail,
      life: 4000,
    })
    return false
  } finally {
    finalizandoCotacao.value = false
  }
}

const abrirModalAnalise = (status) => {
  analiseModo.value = 'options'
  analiseDescricao.value = ''
  statusAnaliseSelecionado.value = status
  observacaoAnalise.value = ''
  modalAnalise.value = true
}

const abrirAnaliseDireta = (action) => {
  if (!action?.targetStatus) {
    return
  }

  analiseModo.value = 'single'
  analiseDescricao.value = action.description ?? ''
  statusAnaliseSelecionado.value = action.targetStatus
  observacaoAnalise.value = ''
  modalAnalise.value = true
}

const resetAnaliseModal = () => {
  analiseModo.value = 'options'
  analiseDescricao.value = ''
  statusAnaliseSelecionado.value = 'analisada'
  observacaoAnalise.value = ''
}

const fecharModalAnalise = () => {
  modalAnalise.value = false
  resetAnaliseModal()
}

const confirmarAnalise = async () => {
  const sucesso = await analisarCotacao(statusAnaliseSelecionado.value, observacaoAnalise.value)
  if (sucesso) {
    fecharModalAnalise()
  }
}

const analisarCotacao = async (status, observacao = '') => {
  if (analisandoCotacao.value) {
    return false
  }

  if (!availableTransitions.value.includes(status)) {
    toast.add({
      severity: 'warn',
      summary: 'Ação não permitida',
      detail: 'O status selecionado não é válido para a etapa atual.',
      life: 3500,
    })
    return false
  }

  try {
    analisandoCotacao.value = true
    await SolicitacaoService.analyze(cotacao.id, {
      status,
      observacao: observacao?.trim() || undefined,
    })

    const mensagensAnalise = {
      analisada: 'Status atualizado para Analisada.',
      analisada_aguardando: 'Status atualizado para Analisada / Aguardando.',
      analise_gerencia: 'Status atualizado para Analis. / Ger.',
      aprovado: 'Status atualizado para Aprovado.',
    }

    toast.add({
      severity: 'success',
      summary: 'Cotação atualizada',
      detail: mensagensAnalise[status] ?? 'Status atualizado com sucesso.',
      life: 4000,
    })

    await carregarCotacao()
    // Recarregar assinaturas após atualizar status (pode ter novas aprovações)
    await carregarAssinaturas()
    router.push({ name: 'cotacoesList' })
    return true
  } catch (error) {
    const detail = error?.response?.data?.message || 'Não foi possível atualizar o status.'
    toast.add({
      severity: 'error',
      summary: 'Erro ao atualizar',
      detail,
      life: 4000,
    })
    return false
  } finally {
    analisandoCotacao.value = false
  }
}

const abrirModalReprovar = () => {
  mensagemReprova.value = ''
  modalReprovar.value = true
}

const confirmarReprovar = async () => {
  if (!mensagemReprova.value.trim()) {
    return
  }

  if (reprovandoCotacao.value) {
    return
  }

  try {
    reprovandoCotacao.value = true
    await SolicitacaoService.reprove(cotacao.id, { mensagem: mensagemReprova.value.trim() })

    toast.add({
      severity: 'success',
      summary: 'Cotação reprovada',
      detail: 'Mensagem enviada ao comprador para ajustes.',
      life: 4000,
    })

    modalReprovar.value = false
    mensagemReprova.value = ''
    await carregarCotacao()
    router.push({ name: 'cotacoesList' })
  } catch (error) {
    const detail = error?.response?.data?.message || 'Não foi possível reprovar a cotação.'
    toast.add({
      severity: 'error',
      summary: 'Erro ao reprovar',
      detail,
      life: 4000,
    })
  } finally {
    reprovandoCotacao.value = false
  }
}

const abrirMensagens = () => {
  modalMensagens.value = true
}

const resumo = computed(() => {
  return produtos.value.map((prod, p) => {
    let indice = selecoes.value[p]
    if (indice === undefined || indice === null) {
      indice = menorIndice(p)
    }

    const cot = indice !== undefined && indice !== null ? cotacoes.value[indice] : null
    const itemOrigem = cotacao.itensOriginais[p] || {}
    const quantidade = parsePreco(prod.qtd) ?? parsePreco(itemOrigem.quantidade) ?? 0
    const valorUnitario = parsePreco(cot?.itens?.[p]?.custoUnit ?? cot?.itens?.[p]?.custoFinal) ?? 0
    const valorTotal =
      parsePreco(cot?.itens?.[p]?.custoFinal) ?? (valorUnitario ? valorUnitario * (quantidade || 0) : 0)

    return {
      produto: prod.descricao || itemOrigem.mercadoria,
      fornecedor: cot?.fornecedor?.A2_NOME || cot?.nome || 'Fornecedor não informado',
      valorUnit: Number(valorUnitario),
      qtd: quantidade,
      total: Number(valorTotal || 0),
      motivo: motivos.value[p] || null,
    }
  })
})

const totalGeral = computed(() => resumo.value.reduce((sum, r) => sum + r.total, 0))

// Ordem de exibição das assinaturas (diferente da ordem de aprovação)
const ordemExibicaoAssinaturas = {
  'COMPRADOR': 1,
  'GERENTE LOCAL': 2,
  'GERENTE GERAL': 3,
  'ENGENHEIRO': 4,
  'DIRETOR': 5,
  'PRESIDENTE': 6,
}

// Ordenar assinaturas pela ordem de exibição
const assinaturasOrdenadas = computed(() => {
  if (!assinaturas.value || Object.keys(assinaturas.value).length === 0) {
    return {}
  }
  
  const ordenadas = {}
  const chaves = Object.keys(assinaturas.value)
  
  // Ordenar chaves pela ordem de exibição
  chaves.sort((a, b) => {
    const ordemA = ordemExibicaoAssinaturas[a] ?? 999
    const ordemB = ordemExibicaoAssinaturas[b] ?? 999
    return ordemA - ordemB
  })
  
  // Reconstruir objeto na ordem correta
  chaves.forEach(chave => {
    ordenadas[chave] = assinaturas.value[chave]
  })
  
  return ordenadas
})

const carregarAssinaturas = async () => {
  try {
    assinaturasLoading.value = true
    // Passar o ID da cotação para buscar apenas assinaturas de aprovações aprovadas
    const quoteId = route.params.id
    const response = await usuarioService.getSignaturesByProfile(quoteId)
    if (response.data?.data) {
      assinaturas.value = response.data.data
    }
  } catch (error) {
    console.error('Erro ao carregar assinaturas:', error)
  } finally {
    assinaturasLoading.value = false
  }
}

const imprimirCotacao = async () => {
  try {
    imprimindoCotacao.value = true
    const id = route.params.id
    if (!id) {
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'ID da cotação não encontrado',
        life: 3000,
      })
      return
    }

    const response = await SolicitacaoService.imprimir(id)
    
    // Criar blob do PDF
    const blob = new Blob([response.data], { type: 'application/pdf' })
    
    // Criar URL temporária
    const url = window.URL.createObjectURL(blob)
    
    // Abrir PDF em nova aba para visualização/impressão
    window.open(url, '_blank')
    
    // Limpar URL após um tempo
    setTimeout(() => {
      window.URL.revokeObjectURL(url)
    }, 100)

    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Abrindo PDF para impressão...',
      life: 2000,
    })
  } catch (error) {
    const detail = error?.response?.data?.message || 'Erro ao gerar PDF da cotação'
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail,
      life: 3000,
    })
  } finally {
    imprimindoCotacao.value = false
  }
}

onMounted(async () => {
  await carregarTodosDados()
  await carregarAssinaturas()
})
</script>

<style scoped>
.tabela-cotacao {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  min-width: 1400px;
}

.tabela-cotacao th,
.tabela-cotacao td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  text-align: left;
  vertical-align: middle;
}

.bg-fornecedor {
  background-color: #f6fff6;
}

.bg-surface-100 {
  background-color: #f8fafb;
}

.p-inputtext-sm {
  font-size: 0.8rem;
}

.melhor-preco {
  border: 2px dashed #f97316 !important; /* laranja */
  background-color: #fff7ed !important;
  font-weight: 600;
  color: #b45309;
}

.quadro-resumo {
  margin-top: 2rem;
  padding: 1.5rem;
  background-color: #fffefc;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
}

.quadro-resumo .tabela-cotacao {
  min-width: 800px;
  width: 100%;
}

.selecionado-manual {
  border: 2px dashed #dc2626 !important; /* vermelho */
  background-color: #fef2f2 !important;
  font-weight: 600;
  color: #991b1b;
}

.produto-card {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  transition: all 0.3s ease;
}
.produto-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Cartões dos fornecedores */
.fornecedor-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s ease;
  background-color: #fafafa;
}
.fornecedor-card:hover {
  transform: scale(1.02);
  border-color: #60a5fa;
}

/* Quando selecionado */
.fornecedor-selecionado {
  border: 2px solid #10b981 !important;
  background-color: #ecfdf5 !important;
  box-shadow: 0 0 0 2px #d1fae5 inset;
}
.fornecedor-selecionado label {
  color: #065f46 !important;
}

.mensagem-item {
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 0.75rem;
  background-color: #f9fafb;
}

.white-space-pre-line {
  white-space: pre-line;
}

.mensagens-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 45vh;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.mensagem-bubble {
  max-width: 70%;
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid #e9ecef;
  background-color: #f5f6f8;
  color: #1f2933;
}

.mensagem-bubble.esquerda {
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}

.mensagem-bubble.direita {
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}

.mensagem-bubble.geral {
  align-self: center;
  background-color: #f8fafc;
}

.mensagem-bubble.reprova {
  background: linear-gradient(135deg, #fee2e2, #fecaca);
  border-color: #fca5a5;
  color: #7f1d1d;
  box-shadow: 0 2px 6px rgba(248, 113, 113, 0.2);
}

.mensagem-bubble.resposta {
  align-self: flex-end;
  background: linear-gradient(135deg, #dcfce7, #bbf7d0);
  border-color: #86efac;
  color: #065f46;
  box-shadow: 0 2px 6px rgba(134, 239, 172, 0.2);
}

.mensagem-bubble.reprova.direita {
  align-self: flex-end;
  border-bottom-right-radius: 4px;
}
.mensagem-bubble.reprova.esquerda {
  align-self: flex-start;
  border-bottom-left-radius: 4px;
}
.mensagem-bubble.destaque {
  max-width: 100%;
  align-self: stretch;
}

.mensagens-container::-webkit-scrollbar {
  width: 6px;
}

.mensagens-container::-webkit-scrollbar-thumb {
  background-color: rgba(148, 163, 184, 0.6);
  border-radius: 999px;
}

.mensagens-container::-webkit-scrollbar-track {
  background-color: rgba(226, 232, 240, 0.6);
  border-radius: 999px;
}

/* Input de fornecedor */
.fornecedor-input .p-inputtext {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fornecedor-input .p-button {
  flex: 0 0 auto;
}

/* Texto */
.text-700 {
  color: #4b5563;
}
.text-800 {
  color: #374151;
}
.text-900 {
  color: #111827;
}
</style>
