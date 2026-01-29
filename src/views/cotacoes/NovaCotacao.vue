<template>
  <div class="card p-4">
    <Toast />
    <!-- Header -->
    <div class="flex justify-content-between align-items-center mb-3">
      <div class="flex align-items-center gap-2">
        <Button icon="pi pi-arrow-left" class="p-button-text" @click="voltar" />
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
          v-if="podeResetar"
          label="Resetar Solicitação"
          icon="pi pi-refresh"
          class="p-button-outlined p-button-warning"
          :loading="loadingResetar"
          :disabled="loadingResetar"
          @click="abrirModalResetar"
      />
      <Button
          v-if="canReprove"
          label="Reprovar"
          icon="pi pi-times"
          class="p-button-danger"
          :loading="reprovandoCotacao"
          :disabled="reprovandoCotacao"
          @click="abrirModalReprovar"
      />
      <Button 
          label="Cancelar" 
          icon="pi pi-times" 
          class="p-button-danger" 
          @click="router.push({ name: 'cotacoesList' })"
      />
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
          <th rowspan="2">Medida</th>
          <th rowspan="2" style="min-width: 140px;">Referência do Produto</th>
          <th rowspan="2" style="min-width: 250px;">Descrição do Produto</th>
          <template v-for="(cot, i) in cotacoes" :key="'cab-' + i">
            <th colspan="8" class="text-center bg-fornecedor" :class="{ 'separador-cotacao': i > 0 }">
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
                <div class="col-12">
                  <InputText 
                      :value="cot.fornecedor?.A2_MUN || cot.fornecedor?.A2_EST ? [cot.fornecedor?.A2_MUN?.trim(), cot.fornecedor?.A2_EST?.trim()].filter(Boolean).join(' - ') : ''" 
                      placeholder="Município - Estado" 
                      readonly
                      :disabled="true"
                  />
                </div>
                <div class="col-12"><InputText v-model="cot.vendedor" placeholder="Vendedor" :disabled="isReadOnly" /></div>
                <div class="col-12">
                  <InputMask
                      v-model="cot.telefone"
                      mask="99 9 9999-9999"
                      placeholder="61 9 9330-5267"
                      :disabled="isReadOnly"
                      class="w-full"
                  />
                </div>
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
                <div class="col-12">
                  <label class="font-medium text-700 mb-2 block">Valor do frete</label>
                  <InputText
                      v-model="cot.valorFrete"
                      placeholder="R$ 0,00"
                      class="w-full"
                      :disabled="isReadOnly"
                      @focus="prepararCampoMoedaFrete(i)"
                      @blur="formatarCampoMoedaFrete(i)"
                  />
                </div>
                <div class="col-12">
                  <label class="font-medium text-700 mb-2 block">Desconto</label>
                  <InputText
                      v-model="cot.desconto"
                      placeholder="R$ 0,00"
                      class="w-full"
                      :disabled="isReadOnly"
                      @focus="prepararCampoMoedaDesconto(i)"
                      @blur="formatarCampoMoedaDesconto(i)"
                  />
                </div>
                <div class="col-12">
                  <label class="font-medium text-700 mb-2 block">Difal (%)</label>
                  <InputText
                      v-model="cot.difalPercent"
                      placeholder="0.00%"
                      class="w-full"
                      :disabled="isReadOnly"
                      @focus="prepararCampoPercentual(i)"
                      @blur="formatarCampoPercentual(i)"
                      @keypress="(e) => {
                        // Permite apenas números, ponto e vírgula
                        const char = String.fromCharCode(e.which);
                        if (!/[0-9.,]/.test(char)) {
                          e.preventDefault();
                        }
                      }"
                      @input="(e) => { 
                        // Permite apenas números, ponto e vírgula durante a digitação
                        let valor = e.target.value.replace(/[^\d.,]/g, '');
                        // Substitui vírgula por ponto
                        valor = valor.replace(/,/g, '.');
                        // Permite apenas um ponto decimal
                        const partes = valor.split('.');
                        if (partes.length > 2) {
                          valor = partes[0] + '.' + partes.slice(1).join('');
                        }
                        // Limita a 2 casas decimais após o ponto
                        if (partes.length === 2 && partes[1].length > 2) {
                          valor = partes[0] + '.' + partes[1].substring(0, 2);
                        }
                        cot.difalPercent = valor;
                      }"
                  />
                </div>
              </div>
            </th>
          </template>
        </tr>

        <tr>
          <template v-for="(cot, i) in cotacoes" :key="'sub-' + i">
            <th :class="{ 'separador-cotacao': i > 0 }">Marca</th>
            <th :class="{ 'separador-cotacao': i > 0 }">Custo Unit.</th>
            <th :class="{ 'separador-cotacao': i > 0 }" style="width: 65px !important; max-width: 65px !important; min-width: 65px !important;">IPI</th>
            <th :class="{ 'separador-cotacao': i > 0 }" style="width: 75px !important; max-width: 75px !important; min-width: 75px !important;">Difal</th>
            <th :class="{ 'separador-cotacao': i > 0 }">ICMS</th>
            <th :class="{ 'separador-cotacao': i > 0 }">ICMS Custo total</th>
            <th :class="{ 'separador-cotacao': i > 0 }">Custo C/ IPI /S Difal</th>
            <th :class="{ 'separador-cotacao': i > 0 }">Custo C/ IPI /C Difal</th>
          </template>
        </tr>
        </thead>

        <tbody>
        <tr v-for="(prod, p) in produtos" :key="'row-' + p">
          <td>{{ p + 1 }}</td>
          <td>{{ prod.qtd }}</td>
          <td>{{ prod.medida || '-' }}</td>
          <td style="min-width: 140px;">{{ prod.referencia || '-' }}</td>
          <td style="min-width: 250px;">{{ prod.descricao }}</td>

          <template v-for="(cot, i) in cotacoes" :key="'linha-' + i + '-' + p">
            <td :class="{ 'separador-cotacao': i > 0 }">
              <InputText
                  v-model="cot.itens[p].marca"
                  placeholder="Marca"
                  class="w-full p-inputtext-sm"
                  :class="isMelhorPreco(cot, p, i)"
                  style="min-width: 120px !important;"
                  :disabled="isReadOnly"
              />
            </td>
            <td :class="{ 'separador-cotacao': i > 0 }">
              <InputText
                  v-model="cot.itens[p].custoUnit"
                  placeholder="R$ 0,00"
                  class="w-full p-inputtext-sm text-right"
                  :class="isMelhorPreco(cot, p, i)"
                  style="min-width: 120px !important;"
                  @focus="prepararCampoMoeda(i, p, 'custoUnit')"
                  @blur="() => { formatarCampoMoeda(i, p, 'custoUnit'); calcularDifalAutomatico(i); }"
                  :disabled="isReadOnly"
              />
            </td>
            <td :class="{ 'separador-cotacao': i > 0 }" style="width: 65px !important; max-width: 65px !important; min-width: 65px !important;">
              <InputText
                  v-model="cot.itens[p].ipi"
                  placeholder="0%"
                  class="p-inputtext-sm text-center"
                  :class="isMelhorPreco(cot, p, i)"
                  style="width: 100%; padding: 0.25rem;"
                  @blur="calcularDifalAutomatico(i)"
                  :disabled="isReadOnly"
              />
            </td>
            <td :class="{ 'separador-cotacao': i > 0 }" style="width: 75px !important; max-width: 75px !important; min-width: 75px !important;">
              <InputText
                  v-model="cot.itens[p].difal"
                  placeholder="R$ 0,00"
                  class="p-inputtext-sm text-right"
                  :class="isMelhorPreco(cot, p, i)"
                  style="width: 100%; padding: 0.25rem;"
                  readonly
              />
            </td>
            <td :class="{ 'separador-cotacao': i > 0 }">
              <InputText
                  v-model="cot.itens[p].icms"
                  placeholder="0%"
                  class="w-full p-inputtext-sm text-center"
                  :class="isMelhorPreco(cot, p, i)"
                  style="min-width: 120px !important;"
                  :disabled="isReadOnly"
              />
            </td>
            <td :class="{ 'separador-cotacao': i > 0 }">
              <InputText
                  v-model="cot.itens[p].icmsTotal"
                  placeholder="R$ 0,00"
                  class="w-full p-inputtext-sm text-right"
                  :class="isMelhorPreco(cot, p, i)"
                  style="min-width: 120px !important;"
                  @focus="prepararCampoMoeda(i, p, 'icmsTotal')"
                  @blur="formatarCampoMoeda(i, p, 'icmsTotal')"
                  :disabled="isReadOnly"
              />
            </td>
            <td :class="{ 'separador-cotacao': i > 0 }">
              <InputText
                  v-model="cot.itens[p].custoIPI"
                  placeholder="R$ 0,00"
                  class="w-full p-inputtext-sm text-right"
                  :class="isMelhorPreco(cot, p, i)"
                  style="min-width: 120px !important;"
                  @focus="prepararCampoMoeda(i, p, 'custoIPI')"
                  @blur="formatarCampoMoeda(i, p, 'custoIPI')"
                  :disabled="isReadOnly"
              />
            </td>
            <td :class="{ 'separador-cotacao': i > 0 }">
              <InputText
                  v-model="cot.itens[p].custoFinal"
                  placeholder="R$ 0,00"
                  class="w-full p-inputtext-sm text-right"
                  :class="isMelhorPreco(cot, p, i)"
                  style="min-width: 120px !important;"
                  @focus="prepararCampoMoeda(i, p, 'custoFinal')"
                  @blur="formatarCampoMoeda(i, p, 'custoFinal')"
                  :disabled="isReadOnly"
              />
            </td>
          </template>
        </tr>
        
        <!-- Linha de resumo por fornecedor -->
        <tr class="resumo-fornecedor">
          <td colspan="5" class="font-semibold text-right pr-3">Resumo:</td>
          <template v-for="(cot, i) in cotacoes" :key="'resumo-' + i">
            <td colspan="8" :class="{ 'separador-cotacao': i > 0 }" class="bg-surface-50">
              <div class="grid p-fluid text-sm p-2">
                <div class="col-12 md:col-6">
                  <div class="flex justify-content-between mb-2">
                    <span class="font-medium text-700">Tipo de frete:</span>
                    <span>{{ cot.tipoFrete === 'F' ? 'FOB' : (cot.tipoFrete === 'C' ? 'CIF' : '-') }}</span>
                  </div>
                  <div class="flex justify-content-between mb-2">
                    <span class="font-medium text-700">Valor do Frete:</span>
                    <span>{{ formatCurrencyValue(cot.valorFrete) || 'R$ 0,00' }}</span>
                  </div>
                  <div class="flex justify-content-between mb-2">
                    <span class="font-medium text-700">Desconto:</span>
                    <span>{{ formatCurrencyValue(cot.desconto) || 'R$ 0,00' }}</span>
                  </div>
                  <div class="flex justify-content-between mb-2">
                    <span class="font-medium text-700">Condição de Pgto:</span>
                    <span>{{ cot.condicaoPagamento?.label || '-' }}</span>
                  </div>
                  <div class="flex justify-content-between">
                    <span class="font-medium text-700">Prazo de Entrega:</span>
                    <span>-</span>
                  </div>
                </div>
                <div class="col-12 md:col-6">
                  <div class="flex justify-content-between mb-2">
                    <span class="font-medium text-700">Total S/ Difal C/IPI + Frete - Desconto:</span>
                    <span class="font-semibold">{{ formatCurrencyValue(calcularTotalSemDifal(i)) }}</span>
                  </div>
                  <div class="flex justify-content-between">
                    <span class="font-medium text-700">Total C/ Difal C/IPI + Frete - Desconto:</span>
                    <span class="font-semibold">{{ formatCurrencyValue(calcularTotalComDifal(i)) }}</span>
                  </div>
                </div>
              </div>
            </td>
          </template>
        </tr>
        </tbody>
      </table>
    </div>

    <!-- Justificativa da Solicitação -->
    <div v-if="cotacao.observation" class="mt-4 p-3 border-round surface-ground border-1 border-300">
      <label class="font-semibold text-700 block mb-2">Justificativa da Solicitação</label>
      <p class="text-900 m-0 whitespace-pre-wrap">{{ cotacao.observation }}</p>
    </div>

    <!-- QUADRO RESUMO -->
    <div v-if="resumo.length" class="quadro-resumo mt-6">
        <h4 class="text-center mb-3 font-semibold">Quadro resumo da cotação e compra</h4>
        <table class="tabela-cotacao">
          <thead>
          <tr>
            <th style="width: 50px;">N°</th>
            <th style="min-width: 300px; max-width: 400px;">Descrição</th>
            <th style="width: 100px;">Marca</th>
            <th style="width: 180px; max-width: 200px;">Fornecedor ganhador</th>
            <th style="width: 120px;">Valor Unitário</th>
            <th style="width: 80px;">Quantidade</th>
            <th style="width: 120px;">Total</th>
            <th style="width: 150px;">Motivo</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(r, index) in resumo" :key="'res-' + index">
            <td style="width: 50px;">{{ index + 1 }}</td>
            <td style="min-width: 300px; max-width: 400px; word-wrap: break-word;">{{ r.produto }}</td>
            <td style="width: 100px;">{{ r.marca || '-' }}</td>
            <td style="width: 180px; max-width: 200px; word-wrap: break-word;">{{ r.fornecedor }}</td>
            <td style="width: 120px;">{{ formatCurrencyValue(r.valorUnit) }}</td>
            <td style="width: 80px;">{{ r.qtd }}</td>
            <td style="width: 120px;">{{ formatCurrencyValue(r.total) }}</td>
            <td style="width: 150px;">{{ r.motivo || '-' }}</td>
          </tr>
          <tr class="bg-surface-100 font-semibold">
            <td colspan="6" class="text-right">Total geral:</td>
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
        <Column header="Município - Estado" sortable>
          <template #body="{ data }">
            {{ [data?.A2_MUN?.trim(), data?.A2_EST?.trim()].filter(Boolean).join(' - ') || '-' }}
          </template>
        </Column>
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
        v-model:visible="modalResetarVisible"
        header="Resetar Solicitação"
        :modal="true"
        :closable="true"
        :style="{ width: '500px' }"
        appendTo="body"
        @hide="fecharModalResetar"
    >
      <p class="text-600 mb-3">
        A solicitação voltará para o status <strong>Aguardando</strong>. As assinaturas serão removidas e o solicitante poderá ver o motivo e editar a solicitação. Os fornecedores serão mantidos.
      </p>
      <label class="block text-600 mb-2">Por que está resetando? (obrigatório)</label>
      <Textarea
          v-model="motivoResetar"
          rows="4"
          placeholder="Digite o motivo do reset..."
          class="w-full mb-3"
      />
      <template #footer>
        <Button label="Cancelar" icon="pi pi-times" class="p-button-secondary" @click="fecharModalResetar" />
        <Button
            label="Resetar"
            icon="pi pi-refresh"
            class="p-button-warning"
            :loading="loadingResetar"
            :disabled="!motivoResetar || !motivoResetar.trim()"
            @click="confirmarResetar"
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
import PermissionsService from '@/service/PermissionsService'
import Dialog from 'primevue/dialog'
import Textarea from 'primevue/textarea'
import RadioButton from 'primevue/radiobutton'
import Toast from 'primevue/toast'
import InputMask from 'primevue/inputmask'

document.title = 'Nova Cotação'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const store = useStore()
const protheusService = new ProtheusService()
const usuarioService = new UsuarioService()
const permissionService = new PermissionsService()

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
  observation: '',
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
// canReprove: sempre que o usuário pode aprovar ou analisar, ele também pode reprovar
const canReprove = computed(() => {
  // Verificar se o usuário pode aprovar/analisar (se approvalAction.type !== 'none')
  const podeAprovarOuAnalisar = approvalAction.value.type !== 'none'
  
  // Se pode aprovar/analisar, também pode reprovar
  if (podeAprovarOuAnalisar) {
    // Só pode reprovar em status específicos
    return ['finalizada', 'analisada', 'analisada_aguardando', 'analise_gerencia', 'aprovado'].includes(cotacao.status?.slug)
  }
  
  return false
})

const STATUS_PERMITIDOS_RESETAR = [
  'em_analise_supervisor',
  'autorizado',
  'cotacao',
  'finalizada',
  'analisada',
  'analisada_aguardando',
  'analise_gerencia',
]
const modalResetarVisible = ref(false)
const motivoResetar = ref('')
const loadingResetar = ref(false)
const podeResetar = computed(() => {
  if (!permissionService.hasPermissions('cotacoes_analisar_selecionar')) return false
  if (!cotacao.status?.slug) return false
  return STATUS_PERMITIDOS_RESETAR.includes(cotacao.status.slug)
})
const abrirModalResetar = () => {
  motivoResetar.value = ''
  modalResetarVisible.value = true
}
const fecharModalResetar = () => {
  modalResetarVisible.value = false
  motivoResetar.value = ''
}
const confirmarResetar = async () => {
  const motivo = (motivoResetar.value || '').trim()
  if (!motivo || !cotacao.id) return
  try {
    loadingResetar.value = true
    await SolicitacaoService.resetSolicitacao(cotacao.id, { motivo })
    toast.add({
      severity: 'success',
      summary: 'Sucesso',
      detail: 'Solicitação resetada. O solicitante poderá ver o motivo e editar.',
      life: 4000,
    })
    fecharModalResetar()
    await carregarCotacao()
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Erro',
      detail: error.response?.data?.message || 'Erro ao resetar solicitação',
      life: 3000,
    })
  } finally {
    loadingResetar.value = false
  }
}

const singleActionMetadata = {
  analise_gerencia: {
    buttonLabel: 'Encaminhar para Diretor',
    buttonClass: 'p-button-info',
    icon: 'pi pi-arrow-right',
    description: 'Encaminhar a cotação para análise do diretor.',
  },
  aprovado: {
    buttonLabel: 'Aprovar Cotação',
    buttonClass: 'p-button-success',
    icon: 'pi pi-check',
    description: 'Aprovar a cotação e concluir o fluxo de aprovação.',
  },
}

// Verificar se o usuário é Engenheiro, Gerente Local ou Gerente Geral (podem aprovar simultaneamente)
const isEngineerOrManager = computed(() => {
  const usuario = store.state.usuario
  if (!usuario || !usuario.permissions || !Array.isArray(usuario.permissions)) {
    return false
  }
  
  // Verificar se o usuário tem grupo/permissão de Engenheiro, Gerente Local ou Gerente Geral
  for (const perm of usuario.permissions) {
    if (perm && perm.name) {
      // Normalizar o nome do grupo: remover espaços extras, converter para minúsculas, remover underscores
      const groupName = perm.name.toLowerCase().replace(/_/g, ' ').trim()
      
      // Debug temporário (remover depois)
      if (process.env.NODE_ENV === 'development') {
        console.log('Verificando grupo:', { original: perm.name, normalized: groupName })
      }
      
      // Verificar variações possíveis do nome
      // Verifica se contém "engenheiro"
      const hasEngenheiro = groupName.includes('engenheiro')
      
      // Verifica se contém "gerente" e ("local" ou "geral")
      const hasGerente = groupName.includes('gerente')
      const hasLocal = groupName.includes('local')
      const hasGeral = groupName.includes('geral')
      
      if (hasEngenheiro || (hasGerente && (hasLocal || hasGeral))) {
        return true
      }
    }
  }
  return false
})

// Verificar se o usuário é Gerente Local ou Gerente Geral (podem escolher status)
const isManager = computed(() => {
  const usuario = store.state.usuario
  if (!usuario || !usuario.permissions || !Array.isArray(usuario.permissions)) {
    return false
  }
  
  // Verificar se o usuário tem grupo/permissão de Gerente Local ou Gerente Geral
  for (const perm of usuario.permissions) {
    if (perm && perm.name) {
      // Normalizar o nome do grupo: remover espaços extras, converter para minúsculas, remover underscores
      const groupName = perm.name.toLowerCase().replace(/_/g, ' ').trim()
      
      // Verificar variações possíveis do nome
      // Verifica se contém "gerente" e ("local" ou "geral")
      const hasGerente = groupName.includes('gerente')
      const hasLocal = groupName.includes('local')
      const hasGeral = groupName.includes('geral')
      
      if (hasGerente && (hasLocal || hasGeral)) {
        return true
      }
    }
  }
  return false
})

// Verificar se o usuário é Gerente Geral ou Diretor (podem aprovar em analise_gerencia)
const isGeneralManagerOrDirector = computed(() => {
  const usuario = store.state.usuario
  if (!usuario || !usuario.permissions || !Array.isArray(usuario.permissions)) {
    return false
  }
  
  // Verificar se o usuário tem grupo/permissão de Gerente Geral ou Diretor
  for (const perm of usuario.permissions) {
    if (perm && perm.name) {
      // Normalizar o nome do grupo: remover espaços extras, converter para minúsculas, remover underscores
      const groupName = perm.name.toLowerCase().replace(/_/g, ' ').trim()
      
      // Verificar variações possíveis do nome
      const hasGerenteGeral = (groupName.includes('gerente') && groupName.includes('geral')) || groupName.includes('gerente geral')
      const hasDiretor = groupName.includes('diretor')
      
      if (hasGerenteGeral || hasDiretor) {
        return true
      }
    }
  }
  return false
})

// Verificar se o usuário tem permissão para aprovar como Diretor
const temPermissaoAprovarDiretor = computed(() => {
  const permissions = store.getters?.permissions || []
  return permissions.includes('cotacoes_aprovar_diretor')
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

  // Verificar se o Diretor tem permissão para aprovar diretamente
  // Se sim, pode aprovar diretamente para "aprovado" quando a cotação tem comprador
  // e está em status: finalizada, analisada, analisada_aguardando, ou analise_gerencia
  if (temPermissaoAprovarDiretor.value && cotacao.buyer && cotacao.buyer.id) {
    const statusPermitidos = ['finalizada', 'analisada', 'analisada_aguardando', 'analise_gerencia']
    if (statusPermitidos.includes(slug)) {
      return {
        type: 'single',
        targetStatus: 'aprovado',
        buttonLabel: 'Aprovar Cotação',
        buttonClass: 'p-button-success',
        icon: 'pi pi-check',
        description: 'Aprovar a cotação diretamente como Diretor, sem precisar de todas as assinaturas intermediárias.',
      }
    }
  }

  // Status "finalizada" é um caso especial: Engenheiros, Gerentes Locais e Gerentes Gerais podem analisar
  // mesmo sem aprovações pendentes (podem aprovar simultaneamente)
  // Isso permite que esses perfis analisem cotações finalizadas independentemente de can_approve
  if (slug === 'finalizada') {
    // Engenheiros, Gerentes Locais e Gerentes Gerais podem aprovar simultaneamente
    if (isEngineerOrManager.value) {
      // Gerente Local ou Gerente Geral podem escolher entre "Analisada" e "Analisada / Aguardando"
      if (isManager.value) {
        return { type: 'options' }
      } else {
        // Engenheiro aprova diretamente para "analisada"
        return {
          type: 'single',
          targetStatus: 'analisada',
          buttonLabel: 'Analisar',
          buttonClass: 'p-button-success',
          icon: 'pi pi-check',
          description: 'Analisar a cotação.',
        }
      }
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

  // Status "analisada" e "analisada_aguardando": todos os níveis intermediários devem mostrar "Analisar"
  // O backend vai identificar se é o último nível e mudar o status automaticamente
  if (slug === 'analisada' || slug === 'analisada_aguardando') {
    // Verificar se o usuário pode aprovar
    if (cotacao.permissions && !cotacao.permissions.can_approve) {
      return { type: 'none' }
    }
    // Todos os níveis mostram "Analisar" - o backend decide se muda status ou não
    return {
      type: 'single',
      targetStatus: 'analisada', // O backend vai decidir se muda para analise_gerencia
      buttonLabel: 'Analisar',
      buttonClass: 'p-button-success',
      icon: 'pi pi-check',
      description: 'Analisar a cotação. O sistema enviará para o diretor automaticamente quando todas as assinaturas intermediárias estiverem completas.',
    }
  }

  // Status "analise_gerencia": Gerente Geral e Diretor podem aprovar mesmo sem aprovações pendentes
  // Isso permite que esses perfis aprovem cotações em análise da gerência independentemente de can_approve
  if (slug === 'analise_gerencia') {
    // Verificar se há transição disponível para "aprovado"
    const transitions = availableTransitions.value
    if (transitions.includes('aprovado')) {
      // Gerente Geral e Diretor podem aprovar
      if (isGeneralManagerOrDirector.value) {
        return {
          type: 'single',
          targetStatus: 'aprovado',
          buttonLabel: 'Aprovar Cotação',
          buttonClass: 'p-button-success',
          icon: 'pi pi-check',
          description: 'Aprovar a cotação e concluir o fluxo de aprovação.',
        }
      }
      // Para outros perfis, verificar can_approve
      if (cotacao.permissions && !cotacao.permissions.can_approve) {
        return { type: 'none' }
      }
      return {
        type: 'single',
        targetStatus: 'aprovado',
        buttonLabel: 'Aprovar Cotação',
        buttonClass: 'p-button-success',
        icon: 'pi pi-check',
        description: 'Aprovar a cotação e concluir o fluxo de aprovação.',
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

const calcularTotalSemDifal = (indexCotacao) => {
  if (!cotacoes.value[indexCotacao] || !produtos.value.length) {
    return 0
  }
  
  let total = 0
  const cot = cotacoes.value[indexCotacao]
  
  produtos.value.forEach((prod, p) => {
    if (cot.itens && cot.itens[p]) {
      // Total S/ Difal = Custo C/ IPI (custoIPI) * quantidade
      const custoIPI = parsePreco(cot.itens[p].custoIPI) || 0
      const qtd = parseFloat(prod.qtd) || 0
      total += custoIPI * qtd
    }
  })
  
  const valorFrete = parsePreco(cot.valorFrete) || 0
  const desconto = parsePreco(cot.desconto) || 0
  return total + valorFrete - desconto
}

const calcularTotalComDifal = (indexCotacao) => {
  if (!cotacoes.value[indexCotacao] || !produtos.value.length) {
    return 0
  }
  
  let total = 0
  const cot = cotacoes.value[indexCotacao]
  
  produtos.value.forEach((prod, p) => {
    if (cot.itens && cot.itens[p]) {
      // Total C/ Difal = Custo Final (custoFinal) * quantidade
      const custoFinal = parsePreco(cot.itens[p].custoFinal) || 0
      const qtd = parseFloat(prod.qtd) || 0
      total += custoFinal * qtd
    }
  })
  
  const valorFrete = parsePreco(cot.valorFrete) || 0
  const desconto = parsePreco(cot.desconto) || 0
  return total + valorFrete - desconto
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
    difal: null,
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
    valorFrete: '',
    desconto: '',
    difalPercent: null,
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
    cotacoes.value[index].municipioEstado = [fornecedor?.A2_MUN?.trim(), fornecedor?.A2_EST?.trim()].filter(Boolean).join(' - ') || null
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

const prepararCampoMoedaFrete = (cotIndex) => {
  if (isReadOnly.value) {
    return
  }
  const cot = cotacoes.value[cotIndex]
  if (!cot) return

  const numero = parsePreco(cot.valorFrete)
  cot.valorFrete = numero === null ? '' : formatNumberValue(numero)
}

const formatarCampoMoedaFrete = (cotIndex) => {
  const cot = cotacoes.value[cotIndex]
  if (!cot) return

  const numero = parsePreco(cot.valorFrete)
  cot.valorFrete = numero === null ? '' : formatCurrencyValue(numero)
}

const prepararCampoMoedaDesconto = (cotIndex) => {
  if (isReadOnly.value) {
    return
  }
  const cot = cotacoes.value[cotIndex]
  if (!cot) return

  const numero = parsePreco(cot.desconto)
  cot.desconto = numero === null ? '' : formatNumberValue(numero)
}

const formatarCampoMoedaDesconto = (cotIndex) => {
  const cot = cotacoes.value[cotIndex]
  if (!cot) return

  const numero = parsePreco(cot.desconto)
  cot.desconto = numero === null ? '' : formatCurrencyValue(numero)
}

const prepararCampoPercentual = (cotIndex) => {
  if (isReadOnly.value) {
    return
  }
  const cot = cotacoes.value[cotIndex]
  if (!cot) return

  // Remove o % se existir e deixa apenas o número (preserva decimais)
  if (cot.difalPercent && typeof cot.difalPercent === 'string') {
    cot.difalPercent = cot.difalPercent.replace('%', '').trim()
  }
}

const formatarCampoPercentual = (cotIndex) => {
  const cot = cotacoes.value[cotIndex]
  if (!cot) return

  // Remove o % se existir, converte para número e adiciona o %
  let valor = cot.difalPercent
  if (valor && typeof valor === 'string') {
    valor = valor.replace('%', '').trim()
    // Permite apenas números e ponto decimal
    valor = valor.replace(/[^\d.,]/g, '').replace(',', '.')
  }
  
  const numero = parseFloat(valor)
  if (isNaN(numero)) {
    cot.difalPercent = ''
  } else {
    // Formatar com 2 casas decimais
    cot.difalPercent = `${numero.toFixed(2)}%`
  }
  
  // Recalcular DIFAL após formatar
  calcularDifalAutomatico(cotIndex)
}

const calcularDifalAutomatico = (cotIndex) => {
  const cot = cotacoes.value[cotIndex]
  if (!cot || !cot.itens) return

  // Extrair o número do difalPercent (remover % se existir)
  let difalPercentValue = cot.difalPercent
  if (difalPercentValue && typeof difalPercentValue === 'string') {
    difalPercentValue = difalPercentValue.replace('%', '').trim()
  }
  const difalPercent = parseFloat(difalPercentValue) || 0
  
  cot.itens.forEach((item, itemIndex) => {
    const custoUnit = parsePreco(item.custoUnit) || 0
    const ipiPercent = parseFloat(item.ipi?.replace('%', '')) || 0
    
    // Calcular IPI
    const ipiValue = (custoUnit * ipiPercent) / 100
    const custoComIPI = custoUnit + ipiValue
    
    // Calcular DIFAL
    const difalValue = (custoUnit * difalPercent) / 100
    
    // Salvar o valor do DIFAL
    item.difal = formatCurrencyValue(difalValue)
    
    // Custo com IPI sem Difal
    item.custoIPI = formatCurrencyValue(custoComIPI)
    
    // Custo com IPI com Difal
    const custoComIPIComDifal = custoComIPI + difalValue
    item.custoFinal = formatCurrencyValue(custoComIPIComDifal)
  })
}

const menorIndice = (itemIndex) => {
  let menorValor = Number.POSITIVE_INFINITY
  let indiceMenor = null

  cotacoes.value.forEach((cot, idx) => {
    const valor = parsePreco(cot?.itens?.[itemIndex]?.custoFinal)
    // Ignora valores zero ou nulos (fornecedor sem produto)
    if (valor !== null && valor > 0 && valor < menorValor) {
      menorValor = valor
      indiceMenor = idx
    }
  })

  return indiceMenor
}

const isMelhorPreco = (cot, itemIndex, cotIndex) => {
  const selecaoManual = selecoes.value[itemIndex]
  const menorPreco = menorIndice(itemIndex)
  
  // Se não houver menor preço, não aplica nenhuma cor
  if (menorPreco === null) {
    return ''
  }

  // Se houver seleção manual diferente do menor preço
  if (selecaoManual !== undefined && selecaoManual !== null && selecaoManual !== menorPreco) {
    // O selecionado manualmente fica laranja
    if (selecaoManual === cotIndex) {
      return 'melhor-preco'
    }
    // O menor preço original fica com cor diferente
    if (menorPreco === cotIndex) {
      return 'menor-preco-original'
    }
    return ''
  }

  // Caso contrário (sem seleção manual ou seleção igual ao menor preço), menor preço fica laranja
  if (menorPreco === cotIndex) {
    return 'melhor-preco'
  }

  return ''
}

const fornecedorNome = (cot, index) =>
  cot?.fornecedor?.A2_NOME || cot?.nome || `Fornecedor ${index + 1}`

const carregarCotacao = async (abrirModalMensagens = false) => {
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
    cotacao.observation = detalhe.observacao ?? ''
    mensagens.value = detalhe.mensagens ?? []

    // Se houver mensagens e o parâmetro indicar, abrir o modal automaticamente
    // Por padrão, só abre no carregamento inicial (não após salvar/analisar)
    if (abrirModalMensagens && mensagens.value && mensagens.value.length > 0) {
      modalMensagens.value = true
    }

    produtos.value = cotacao.itensOriginais.map((item, index) => ({
      id: item.id || index + 1,
      qtd: item.quantidade,
      medida: item.unidade || item.unit || '-',
      referencia: item.referencia ?? item.referencia_produto ?? null,
      descricao: item.mercadoria,
    }))

    const cotacoesSalvas = detalhe.cotacoes ?? []

    cotacoes.value = cotacoesSalvas.map((cot) => {
      const fornecedorInfo = {
        A2_COD: cot.codigo ?? null,
        A2_NOME: cot.nome ?? '',
        A2_CGC: cot.cnpj ?? null,
        A2_MUN: cot.municipio ?? null,
        A2_EST: cot.estado ?? null,
      }

      const itens = cotacao.itensOriginais.map((itemOrigem) => {
        const itemSalvo = (cot.itens ?? []).find((it) => it.item_id === itemOrigem.id) ?? {}
        return {
          id: itemSalvo.id ?? null,
          itemId: itemOrigem.id,
          marca: (itemSalvo.marca && itemSalvo.marca.trim() !== '') ? itemSalvo.marca.trim() : null,
          custoUnit: formatCurrencyValue(itemSalvo.custo_unit),
          ipi: formatNumberValue(itemSalvo.ipi),
          custoIPI: formatCurrencyValue(itemSalvo.custo_ipi),
          difal: formatCurrencyValue(itemSalvo.difal),
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
        valorFrete: formatCurrencyValue(cot.valor_frete),
        desconto: formatCurrencyValue(cot.desconto),
        difalPercent: (() => {
          const valor = cot.difal_percent
          if (valor === null || valor === undefined || valor === '') {
            return null
          }
          const numero = parseFloat(valor)
          if (isNaN(numero)) {
            return null
          }
          return `${numero.toFixed(2)}%`
        })(),
        municipioEstado: cot.municipio_estado ?? (fornecedorInfo.A2_MUN || fornecedorInfo.A2_EST ? [fornecedorInfo.A2_MUN?.trim(), fornecedorInfo.A2_EST?.trim()].filter(Boolean).join(' - ') || null : null),
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
  // No carregamento inicial, abrir modal de mensagens se houver
  await carregarCotacao(true)
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

  // Garantir que todos os itens tenham uma seleção (usar menor preço se não houver seleção)
  produtos.value.forEach((prod, p) => {
    if (selecoes.value[p] === undefined || selecoes.value[p] === null) {
      const menor = menorIndice(p)
      if (menor !== null) {
        selecoes.value[p] = menor
      }
    }
  })

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

      // Extrair município e estado de municipioEstado ou do fornecedor
      let municipality = null
      let state = null
      if (cot.municipioEstado) {
        const parts = cot.municipioEstado.split(' - ')
        municipality = parts[0]?.trim() || null
        state = parts[1]?.trim() || null
      } else if (cot.fornecedor?.A2_MUN || cot.fornecedor?.A2_EST) {
        municipality = cot.fornecedor?.A2_MUN?.trim() || null
        state = cot.fornecedor?.A2_EST?.trim() || null
      }

      const payloadFornecedor = {
      id: cot.id ?? null,
      codigo: cot.fornecedor?.A2_COD ?? cot.codigo ?? null,
      nome: nomeFornecedor,
      cnpj: cot.fornecedor?.A2_CGC ?? cot.cnpj ?? null,
      municipality: municipality,
      state: state,
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
      valor_frete: parsePreco(cot.valorFrete),
      desconto: parsePreco(cot.desconto),
      difal_percent: (() => {
        let valor = cot.difalPercent
        if (valor && typeof valor === 'string') {
          valor = valor.replace('%', '').trim()
        }
        return parseFloat(valor) || null
      })(),
      itens: cot.itens.map((item, idx) => {
        const itemOrigem = cotacao.itensOriginais[idx]
        return {
          id: item.id ?? null,
          item_id: item.itemId ?? itemOrigem?.id ?? null,
          marca: (item.marca && item.marca.trim() !== '') ? item.marca.trim() : null,
          custo_unit: parsePreco(item.custoUnit),
          ipi: parsePreco(item.ipi),
          custo_ipi: parsePreco(item.custoIPI),
          difal: parsePreco(item.difal),
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

const abrirAnaliseDireta = async (action) => {
  if (!action?.targetStatus) {
    return
  }

  const currentStatus = cotacao.status?.slug

  // Se o Diretor está aprovando diretamente para "aprovado" (com permissão cotacoes_aprovar_diretor)
  if (action.targetStatus === 'aprovado' && temPermissaoAprovarDiretor.value && cotacao.buyer && cotacao.buyer.id) {
    // Chamar approve diretamente sem modal
    try {
      analisandoCotacao.value = true
      await SolicitacaoService.approve(cotacao.id, {
        status: 'aprovado',
        observacao: '',
      })
      
      toast.add({
        severity: 'success',
        summary: 'Cotação aprovada',
        detail: 'Cotação aprovada diretamente como Diretor. Todas as assinaturas intermediárias foram aprovadas automaticamente.',
        life: 4000,
      })
      
      await carregarCotacao()
      await carregarAssinaturas()
      router.push({ name: 'cotacoesList' })
    } catch (error) {
      const detail = error?.response?.data?.message || 'Não foi possível aprovar a cotação.'
      toast.add({
        severity: 'error',
        summary: 'Erro ao aprovar',
        detail,
        life: 4000,
      })
    } finally {
      analisandoCotacao.value = false
    }
    return
  }

  // Se o status atual é "finalizada", "analisada" ou "analisada_aguardando" e o targetStatus é "analisada" ou "analisada_aguardando",
  // usar o método approve ao invés de analyze, pois o backend gerencia a mudança de status automaticamente
  if ((currentStatus === 'finalizada' || currentStatus === 'analisada' || currentStatus === 'analisada_aguardando') && 
      (action.targetStatus === 'analisada' || action.targetStatus === 'analisada_aguardando')) {
    // Chamar approve diretamente sem modal
    try {
      analisandoCotacao.value = true
      await SolicitacaoService.approve(cotacao.id, {
        observacao: '',
      })
      
      toast.add({
        severity: 'success',
        summary: 'Análise realizada',
        detail: 'Assinatura registrada com sucesso. O sistema enviará para o diretor automaticamente quando todas as assinaturas intermediárias estiverem completas.',
        life: 4000,
      })
      
      await carregarCotacao()
      await carregarAssinaturas()
      router.push({ name: 'cotacoesList' })
    } catch (error) {
      const detail = error?.response?.data?.message || 'Não foi possível realizar a análise.'
      toast.add({
        severity: 'error',
        summary: 'Erro ao analisar',
        detail,
        life: 4000,
      })
    } finally {
      analisandoCotacao.value = false
    }
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
  const currentStatus = cotacao.status?.slug
  const targetStatus = statusAnaliseSelecionado.value
  
  // Se o status atual é "finalizada", "analisada" ou "analisada_aguardando" e o targetStatus é "analisada" ou "analisada_aguardando",
  // usar o método approve ao invés de analyze, pois o backend gerencia a mudança de status automaticamente
  if ((currentStatus === 'finalizada' || currentStatus === 'analisada' || currentStatus === 'analisada_aguardando') && 
      (targetStatus === 'analisada' || targetStatus === 'analisada_aguardando')) {
    try {
      analisandoCotacao.value = true
      const payload = {
        observacao: observacaoAnalise.value?.trim() || undefined,
      }
      // Se o status atual é "finalizada", enviar o status desejado para o backend mudar antes de salvar a assinatura
      if (currentStatus === 'finalizada') {
        payload.status = targetStatus
      }
      await SolicitacaoService.approve(cotacao.id, payload)
      
      toast.add({
        severity: 'success',
        summary: 'Análise realizada',
        detail: 'Assinatura registrada com sucesso. O sistema enviará para o diretor automaticamente quando todas as assinaturas intermediárias estiverem completas.',
        life: 4000,
      })
      
      await carregarCotacao()
      await carregarAssinaturas()
      fecharModalAnalise()
      router.push({ name: 'cotacoesList' })
    } catch (error) {
      const detail = error?.response?.data?.message || 'Não foi possível realizar a análise.'
      toast.add({
        severity: 'error',
        summary: 'Erro ao analisar',
        detail,
        life: 4000,
      })
    } finally {
      analisandoCotacao.value = false
    }
    return
  }
  
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

const voltar = () => {
  router.push({ name: 'cotacoesList' })
}

const abrirMensagens = () => {
  modalMensagens.value = true
}

const resumo = computed(() => {
  return produtos.value.map((prod, p) => {
    // Usa a seleção manual se houver, caso contrário usa o menor preço
    const selecaoManual = selecoes.value[p]
    const menorPreco = menorIndice(p)
    const indice = selecaoManual !== undefined && selecaoManual !== null 
      ? selecaoManual 
      : menorPreco

    const cot = indice !== undefined && indice !== null ? cotacoes.value[indice] : null
    const itemOrigem = cotacao.itensOriginais[p] || {}
    const quantidade = parsePreco(prod.qtd) ?? parsePreco(itemOrigem.quantidade) ?? 0
    const valorUnitario = parsePreco(cot?.itens?.[p]?.custoFinal) ?? 0
    const valorTotal = valorUnitario ? valorUnitario * (quantidade || 0) : 0

    const itemCotacao = cot?.itens?.[p]
    const marca = itemCotacao?.marca || null

    return {
      produto: prod.descricao || itemOrigem.mercadoria,
      marca: marca,
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

    const response = await SolicitacaoService.imprimir(id, 'cotacao')
    
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
  min-width: 1600px;
  table-layout: auto;
}

.tabela-cotacao th,
.tabela-cotacao td {
  border: 1px solid #e5e7eb;
  padding: 0.5rem;
  text-align: left;
  vertical-align: middle;
}

.tabela-cotacao th:first-child,
.tabela-cotacao td:first-child {
  text-align: center;
  width: 50px;
}

.tabela-cotacao th:nth-child(2),
.tabela-cotacao td:nth-child(2) {
  text-align: center;
  width: 60px;
}

.tabela-cotacao th:nth-child(3),
.tabela-cotacao td:nth-child(3) {
  text-align: center;
  width: 80px;
}

.tabela-cotacao th:nth-child(4),
.tabela-cotacao td:nth-child(4) {
  min-width: 140px;
  max-width: 200px;
  word-wrap: break-word;
}

.tabela-cotacao th:nth-child(5),
.tabela-cotacao td:nth-child(5) {
  min-width: 250px;
  max-width: 350px;
  word-wrap: break-word;
}

.bg-fornecedor {
  background-color: #f6fff6;
}

.separador-cotacao {
  border-left: 2px solid #e2e8f0 !important;
  padding-left: 0.75rem !important;
  margin-left: 0.25rem;
}

.resumo-fornecedor {
  background-color: #f8fafb;
}

.resumo-fornecedor td {
  border-top: 2px solid #cbd5e1 !important;
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

.menor-preco-original {
  border: 2px dashed #fbbf24 !important; /* amarelo */
  background-color: #fffbeb !important;
  font-weight: 500;
  color: #92400e;
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
