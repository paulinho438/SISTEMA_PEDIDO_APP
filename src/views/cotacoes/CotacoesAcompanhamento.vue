<template>
  <div class="card p-5">
    <!-- Cabeçalho -->
    <div class="flex align-items-center justify-content-between mb-4">
      <div class="flex align-items-center">
        <Button icon="pi pi-arrow-left" class="p-button-text mr-2" @click="voltar" />
        <h4 class="m-0">Acompanhamento de Cotações</h4>
      </div>
      <div class="flex gap-2">
        <Button 
          label="Exportar Excel" 
          icon="pi pi-file-excel" 
          class="p-button-success"
          @click="exportarExcel"
          :loading="exportando"
        />
        <Button 
          label="Atualizar" 
          icon="pi pi-refresh" 
          @click="carregar"
          :loading="loading"
        />
      </div>
    </div>

    <!-- Filtros -->
    <div class="grid mb-4">
      <div class="col-12 md:col-3">
        <label class="block text-600 mb-2">Status</label>
        <Dropdown
          v-model="filtros.status"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Todos os status"
          showClear
          class="w-full"
          @change="carregar"
        />
      </div>
      <div class="col-12 md:col-3">
        <label class="block text-600 mb-2">Comprador</label>
        <InputText
          v-model="filtros.comprador"
          placeholder="Filtrar por comprador"
          class="w-full"
          @input="onFiltroChange"
        />
      </div>
      <div class="col-12 md:col-3">
        <label class="block text-600 mb-2">Solicitante</label>
        <InputText
          v-model="filtros.solicitante"
          placeholder="Filtrar por solicitante"
          class="w-full"
          @input="onFiltroChange"
        />
      </div>
      <div class="col-12 md:col-3">
        <label class="block text-600 mb-2">Número RM</label>
        <InputText
          v-model="filtros.numero_rm"
          placeholder="Filtrar por número"
          class="w-full"
          @input="onFiltroChange"
        />
      </div>
    </div>

    <!-- Tabela -->
    <div class="overflow-auto">
      <DataTable
        :value="cotacoesFiltradas"
        :loading="loading"
        stripedRows
        showGridlines
        responsiveLayout="scroll"
        :scrollable="true"
        scrollHeight="600px"
        class="p-datatable-sm"
      >
        <Column field="numero_rm" header="NÚMERO RM" :sortable="true" style="min-width: 120px">
          <template #body="{ data }">
            <span class="font-semibold">{{ data.numero_rm }}</span>
          </template>
        </Column>
        <Column field="numero_protheus" header="NÚMERO PROTHEUS" :sortable="true" style="min-width: 150px" />
        <Column field="solicitante" header="SOLICITANTE" :sortable="true" style="min-width: 150px" />
        <Column field="prioridade" header="PRIORIDADE" :sortable="true" style="min-width: 100px">
          <template #body="{ data }">
            {{ data.prioridade ?? '-' }}
          </template>
        </Column>
        <Column field="comprador" header="COMPRADOR" :sortable="true" style="min-width: 150px" />
        <Column field="frente_obra" header="FRENTE DE OBRA" :sortable="true" style="min-width: 120px" />
        <Column field="data_solicitacao" header="DATA DA SOLICITAÇÃO" :sortable="true" style="min-width: 150px" />
        <Column field="data_encaminhamento" header="DATA ENCAMINHAMENTO" :sortable="true" style="min-width: 170px" />
        <Column field="data_finalizacao" header="DATA FINALIZAÇÃO" :sortable="true" style="min-width: 150px" />
        <Column field="data_aprovacao_diretor" header="DATA DE APROVAÇÃO (DIRETOR)" :sortable="true" style="min-width: 200px" />
        <Column field="dias_finalizacao_aprovacao" header="DATA FINALIZAÇÃO X DATA DE APROVAÇÃO (DIA)" :sortable="true" style="min-width: 280px">
          <template #body="{ data }">
            <span :class="getDiasClass(data.dias_finalizacao_aprovacao)">
              {{ data.dias_finalizacao_aprovacao ?? '-' }}
            </span>
          </template>
        </Column>
        <Column field="quant_dias_com_rm" header="QUANT. DIAS COM RM" :sortable="true" style="min-width: 150px">
          <template #body="{ data }">
            {{ data.quant_dias_com_rm ?? '-' }}
          </template>
        </Column>
        <Column field="dias_atraso_inicio_cotacao" header="DIAS DE ATRASO P INICIO COTAÇÃO" :sortable="true" style="min-width: 220px">
          <template #body="{ data }">
            <span :class="getDiasClass(data.dias_atraso_inicio_cotacao)">
              {{ data.dias_atraso_inicio_cotacao ?? '-' }}
            </span>
          </template>
        </Column>
        <Column field="tempo_solicitacao" header="TEMPO DE SOLICITAÇÃO" :sortable="true" style="min-width: 170px">
          <template #body="{ data }">
            {{ data.tempo_solicitacao ?? '-' }}
          </template>
        </Column>
        <Column field="dias_atraso" header="DIAS DE ATRASO" :sortable="true" style="min-width: 120px">
          <template #body="{ data }">
            <span :class="getDiasAtrasoClass(data.dias_atraso)">
              {{ data.dias_atraso ?? '-' }}
            </span>
          </template>
        </Column>
        <Column field="data_liberacao_coleta" header="DATA LIBERAÇÃO PARA COLETA" :sortable="true" style="min-width: 200px" />
        <Column field="data_coleta" header="DATA DA COLETA" :sortable="true" style="min-width: 130px" />
        <Column field="dias_atraso_coleta" header="DIAS DE ATRASO NA COLETA" :sortable="true" style="min-width: 180px">
          <template #body="{ data }">
            <span :class="getDiasClass(data.dias_atraso_coleta)">
              {{ data.dias_atraso_coleta ?? '-' }}
            </span>
          </template>
        </Column>
        <Column field="data_atendimento" header="DATA DE ATENDIMENTO (ALMOXARIFADO)" :sortable="true" style="min-width: 250px" />
        <Column field="dias_atraso_coleta_atendimento" header="DIAS DE ATRASO ENTRE COLETA E ATEND." :sortable="true" style="min-width: 250px">
          <template #body="{ data }">
            <span :class="getDiasClass(data.dias_atraso_coleta_atendimento)">
              {{ data.dias_atraso_coleta_atendimento ?? '-' }}
            </span>
          </template>
        </Column>
        <Column field="quantidade_dias_entrega" header="QUANTIDADE DE DIAS PARA ENTREGA" :sortable="true" style="min-width: 220px">
          <template #body="{ data }">
            {{ data.quantidade_dias_entrega ?? '-' }}
          </template>
        </Column>
        <Column field="status" header="STATUS" :sortable="true" style="min-width: 150px">
          <template #body="{ data }">
            <Tag 
              :value="data.status" 
              :severity="getStatusSeverity(data.status_slug)"
            />
          </template>
        </Column>
        <Column field="descricao" header="DESCRIÇÃO" :sortable="true" style="min-width: 300px">
          <template #body="{ data }">
            <span class="text-sm">{{ data.descricao }}</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import SolicitacaoService from '@/service/SolicitacaoService'

const router = useRouter()
const toast = useToast()

const loading = ref(false)
const exportando = ref(false)
const cotacoes = ref([])

const filtros = ref({
  status: null,
  comprador: '',
  solicitante: '',
  numero_rm: '',
})

const statusOptions = [
  { label: 'Aguardando', value: 'aguardando' },
  { label: 'Autorizado', value: 'autorizado' },
  { label: 'Cotação', value: 'cotacao' },
  { label: 'Compra em Andamento', value: 'compra_em_andamento' },
  { label: 'Finalizada', value: 'finalizada' },
  { label: 'Analisada', value: 'analisada' },
  { label: 'Analisada / Aguardando', value: 'analisada_aguardando' },
  { label: 'Análise / Gerência', value: 'analise_gerencia' },
  { label: 'Aprovado', value: 'aprovado' },
]

const cotacoesFiltradas = computed(() => {
  let filtered = [...cotacoes.value]

  if (filtros.value.status) {
    filtered = filtered.filter(c => c.status_slug === filtros.value.status)
  }

  if (filtros.value.comprador) {
    const search = filtros.value.comprador.toLowerCase()
    filtered = filtered.filter(c => 
      c.comprador?.toLowerCase().includes(search)
    )
  }

  if (filtros.value.solicitante) {
    const search = filtros.value.solicitante.toLowerCase()
    filtered = filtered.filter(c => 
      c.solicitante?.toLowerCase().includes(search)
    )
  }

  if (filtros.value.numero_rm) {
    const search = filtros.value.numero_rm.toLowerCase()
    filtered = filtered.filter(c => 
      c.numero_rm?.toLowerCase().includes(search)
    )
  }

  return filtered
})

const getStatusSeverity = (statusSlug) => {
  const severityMap = {
    'aguardando': 'warning',
    'autorizado': 'info',
    'cotacao': 'info',
    'compra_em_andamento': 'info',
    'finalizada': 'success',
    'analisada': 'success',
    'analisada_aguardando': 'warning',
    'analise_gerencia': 'info',
    'aprovado': 'success',
  }
  return severityMap[statusSlug] || 'secondary'
}

const getDiasClass = (dias) => {
  if (dias === null || dias === undefined) return ''
  if (dias < 0) return 'text-red-500 font-semibold'
  if (dias > 0) return 'text-orange-500 font-semibold'
  return 'text-green-500 font-semibold'
}

const getDiasAtrasoClass = (dias) => {
  if (dias === null || dias === undefined) return ''
  if (dias < 0) return 'text-green-500 font-semibold' // Negativo = adiantado
  if (dias > 0) return 'text-red-500 font-semibold' // Positivo = atrasado
  return ''
}

let filtroTimeout = null
const onFiltroChange = () => {
  if (filtroTimeout) {
    clearTimeout(filtroTimeout)
  }
  filtroTimeout = setTimeout(() => {
    // Filtro já é reativo via computed
  }, 300)
}

const carregar = async () => {
  try {
    loading.value = true
    const response = await SolicitacaoService.acompanhamento()
    console.log('Resposta da API:', response.data)
    cotacoes.value = response.data?.data ?? []
    console.log('Cotações carregadas:', cotacoes.value.length)
    
    if (cotacoes.value.length === 0) {
      toast.add({
        severity: 'info',
        summary: 'Informação',
        detail: 'Nenhuma cotação encontrada.',
        life: 3000,
      })
    }
  } catch (error) {
    console.error('Erro ao carregar acompanhamento:', error)
    console.error('Detalhes do erro:', error.response?.data)
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: error.response?.data?.message || 'Não foi possível carregar os dados de acompanhamento.',
      life: 4000,
    })
  } finally {
    loading.value = false
  }
}

const exportarExcel = async () => {
  try {
    exportando.value = true
    
    // Preparar dados para exportação
    const dados = cotacoesFiltradas.value.map(c => ({
      'NÚMERO RM': c.numero_rm,
      'NÚMERO PROTHEUS': c.numero_protheus || '',
      'SOLICITANTE': c.solicitante,
      'PRIORIDADE': c.prioridade || '',
      'COMPRADOR': c.comprador || '',
      'FRENTE DE OBRA': c.frente_obra || '',
      'DATA DA SOLICITAÇÃO': c.data_solicitacao || '',
      'DATA ENCAMINHAMENTO': c.data_encaminhamento || '',
      'DATA FINALIZAÇÃO': c.data_finalizacao || '',
      'DATA DE APROVAÇÃO (DIRETOR)': c.data_aprovacao_diretor || '',
      'DATA FINALIZAÇÃO X DATA DE APROVAÇÃO (DIA)': c.dias_finalizacao_aprovacao ?? '',
      'QUANT. DIAS COM RM': c.quant_dias_com_rm ?? '',
      'DIAS DE ATRASO P INICIO COTAÇÃO': c.dias_atraso_inicio_cotacao ?? '',
      'TEMPO DE SOLICITAÇÃO': c.tempo_solicitacao ?? '',
      'DIAS DE ATRASO': c.dias_atraso ?? '',
      'DATA LIBERAÇÃO PARA COLETA': c.data_liberacao_coleta || '',
      'DATA DA COLETA': c.data_coleta || '',
      'DIAS DE ATRASO NA COLETA': c.dias_atraso_coleta ?? '',
      'DATA DE ATENDIMENTO (ALMOXARIFADO)': c.data_atendimento || '',
      'DIAS DE ATRASO ENTRE COLETA E ATEND.': c.dias_atraso_coleta_atendimento ?? '',
      'QUANTIDADE DE DIAS PARA ENTREGA': c.quantidade_dias_entrega ?? '',
      'STATUS': c.status,
      'DESCRIÇÃO': c.descricao,
    }))
    
    // Criar CSV
    const headers = Object.keys(dados[0] || {})
    const csvContent = [
      headers.join(';'),
      ...dados.map(row => headers.map(h => `"${row[h] || ''}"`).join(';'))
    ].join('\n')
    
    // Criar blob e download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `acompanhamento_cotacoes_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Arquivo exportado com sucesso!',
      life: 3000,
    })
  } catch (error) {
    console.error('Erro ao exportar:', error)
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: 'Não foi possível exportar os dados.',
      life: 4000,
    })
  } finally {
    exportando.value = false
  }
}

const voltar = () => {
  router.push({ name: 'cotacoesList' })
}

onMounted(() => {
  carregar()
})
</script>

<style scoped>
:deep(.p-datatable) {
  font-size: 0.85rem;
}

:deep(.p-datatable thead th) {
  background-color: #e8f5e9;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  padding: 0.75rem 0.5rem;
}

:deep(.p-datatable tbody td) {
  padding: 0.5rem;
  text-align: center;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background-color: #f9fafb;
}
</style>

