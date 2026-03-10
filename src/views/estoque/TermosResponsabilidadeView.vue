<template>
  <div class="card p-5 bg-page">
    <div class="flex align-items-center gap-2 mb-4">
      <Button icon="pi pi-arrow-left" class="p-button-text" @click="voltar" />
      <h5 class="text-900 m-0">Termo de Responsabilidade {{ termo?.numero }}</h5>
    </div>

    <div v-if="carregando" class="flex justify-content-center p-4">
      <ProgressSpinner />
    </div>

    <template v-else-if="termo">
      <div class="grid mb-4">
        <div class="col-12 md:col-6">
          <label class="text-600">Responsável</label>
          <p class="m-0 font-semibold">{{ termo.responsible_name }}</p>
        </div>
        <div class="col-12 md:col-3">
          <label class="text-600">CPF</label>
          <p class="m-0">{{ termo.cpf || '-' }}</p>
        </div>
        <div class="col-12 md:col-3">
          <label class="text-600">Status</label>
          <p class="m-0">
            <Tag :value="statusLabel(termo.status)" :severity="statusSeverity(termo.status)" />
          </p>
        </div>
        <div class="col-12 md:col-6">
          <label class="text-600">Obra/Projeto</label>
          <p class="m-0">{{ termo.project || '-' }}</p>
        </div>
        <div class="col-12 md:col-6">
          <label class="text-600">Local de retirada</label>
          <p class="m-0">{{ termo.stock_location?.name || '-' }}</p>
        </div>
        <div class="col-12 md:col-6">
          <label class="text-600">Data de emissão</label>
          <p class="m-0">{{ formatarData(termo.created_at) }}</p>
        </div>
        <div v-if="termo.status === 'devolvido'" class="col-12 md:col-6">
          <label class="text-600">Devolvido em</label>
          <p class="m-0">{{ formatarData(termo.returned_at) }}</p>
        </div>
      </div>

      <label class="text-600 block mb-2">Itens</label>
      <DataTable :value="termo.items" dataKey="id" class="p-datatable-sm" responsiveLayout="scroll">
        <Column field="product.code" header="Código">
          <template #body="slotProps">
            {{ slotProps.data.product?.code ?? '-' }}
          </template>
        </Column>
        <Column field="product.description" header="Descrição">
          <template #body="slotProps">
            {{ slotProps.data.product?.description ?? '-' }}
          </template>
        </Column>
        <Column field="quantity" header="Quantidade">
          <template #body="slotProps">
            {{ slotProps.data.quantity }}
          </template>
        </Column>
        <Column field="quantity_returned" header="Devolvido">
          <template #body="slotProps">
            {{ Number(slotProps.data.quantity_returned || 0) }}
          </template>
        </Column>
        <Column field="quantity_pending" header="Pendente">
          <template #body="slotProps">
            {{ getPendente(slotProps.data) }}
          </template>
        </Column>
        <Column field="product.unit" header="Un.">
          <template #body="slotProps">
            {{ slotProps.data.product?.unit ?? 'UN' }}
          </template>
        </Column>
        <Column v-if="termo.status !== 'devolvido'" header="Devolver agora" style="min-width: 180px">
          <template #body="slotProps">
            <InputNumber
              v-if="getPendente(slotProps.data) > 0"
              v-model="devolucaoItens[slotProps.data.id]"
              :min="0"
              :max="getPendente(slotProps.data)"
              :maxFractionDigits="4"
              :useGrouping="false"
              class="w-full"
              inputClass="w-full"
            />
            <span v-else class="text-500">Totalmente devolvido</span>
          </template>
        </Column>
      </DataTable>

      <div class="flex gap-2 mt-4">
        <Button label="Baixar PDF" icon="pi pi-file-pdf" class="p-button-outlined p-button-danger" @click="baixarPdf" />
        <Button
          v-if="termo.status !== 'devolvido'"
          label="Devolver itens selecionados"
          icon="pi pi-replay"
          class="p-button-success"
          :loading="devolvendo"
          @click="confirmarDevolverSelecionados"
        />
        <Button
          v-if="termo.status !== 'devolvido'"
          label="Devolver tudo pendente"
          icon="pi pi-check-circle"
          class="p-button-outlined p-button-success"
          :loading="devolvendoTudo"
          @click="confirmarDevolverTudo"
        />
      </div>
    </template>

    <ConfirmDialog />
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import InputNumber from 'primevue/inputnumber';
import ConfirmDialog from 'primevue/confirmdialog';
import Toast from 'primevue/toast';
import ResponsibilityTermService from '@/service/ResponsibilityTermService';

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

const termo = ref(null);
const carregando = ref(true);
const devolvendo = ref(false);
const devolvendoTudo = ref(false);
const devolucaoItens = ref({});
const id = computed(() => Number(route.params.id));

const formatarData = (v) => {
  if (!v) return '-';
  return new Date(v).toLocaleString('pt-BR');
};

const statusLabel = (status) => {
  if (status === 'devolvido') return 'Devolvido';
  if (status === 'parcial') return 'Parcial';
  return 'Aberto';
};

const statusSeverity = (status) => {
  if (status === 'devolvido') return 'success';
  if (status === 'parcial') return 'info';
  return 'warning';
};

const getPendente = (item) => {
  const quantity = Number(item?.quantity || 0);
  const returned = Number(item?.quantity_returned || 0);
  return Math.max(Number((quantity - returned).toFixed(4)), 0);
};

const preencherDevolucaoItens = () => {
  const itens = termo.value?.items || [];
  const novo = {};
  itens.forEach((item) => {
    novo[item.id] = getPendente(item);
  });
  devolucaoItens.value = novo;
};

const voltar = () => router.push({ name: 'estoqueTermosResponsabilidade' });

const carregar = async () => {
  if (!id.value) return;
  carregando.value = true;
  try {
    const { data } = await ResponsibilityTermService.get(id.value);
    termo.value = data?.data ?? data;
    preencherDevolucaoItens();
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro', detail: e?.response?.data?.message || 'Falha ao carregar.', life: 4000 });
    termo.value = null;
  } finally {
    carregando.value = false;
  }
};

const baixarPdf = async () => {
  try {
    const { data } = await ResponsibilityTermService.pdf(id.value);
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `termo-responsabilidade-${termo.value?.numero ?? id.value}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.add({ severity: 'success', summary: 'PDF', detail: 'Download iniciado.', life: 2000 });
  } catch (e) {
    toast.add({ severity: 'error', summary: 'Erro', detail: e?.response?.data?.message || 'Falha ao gerar PDF.', life: 4000 });
  }
};

const confirmarDevolver = () => {
  confirm.require({
    message: 'Confirmar devolução total dos itens pendentes?',
    header: 'Devolver Termo',
    icon: 'pi pi-replay',
    acceptClass: 'p-button-success',
    acceptLabel: 'Sim, devolver',
    rejectLabel: 'Cancelar',
    accept: async () => {
      devolvendoTudo.value = true;
      try {
        await ResponsibilityTermService.devolver(id.value);
        toast.add({ severity: 'success', summary: 'Devolvido', detail: 'Todos os itens pendentes retornaram ao estoque.', life: 4000 });
        carregar();
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Erro', detail: e?.response?.data?.message || 'Falha ao devolver.', life: 4000 });
      } finally {
        devolvendoTudo.value = false;
      }
    },
  });
};

const confirmarDevolverTudo = () => confirmarDevolver();

const confirmarDevolverSelecionados = () => {
  const itens = (termo.value?.items || [])
    .map((item) => {
      const quantity = Number(devolucaoItens.value[item.id] || 0);
      return { id: item.id, quantity, pending: getPendente(item) };
    })
    .filter((item) => item.quantity > 0);

  if (!itens.length) {
    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Informe ao menos uma quantidade para devolver.', life: 3000 });
    return;
  }

  const invalido = itens.find((item) => item.quantity > item.pending);
  if (invalido) {
    toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Há quantidade maior do que o pendente em um dos itens.', life: 3500 });
    return;
  }

  confirm.require({
    message: 'Confirmar devolução parcial dos itens selecionados?',
    header: 'Devolver Itens',
    icon: 'pi pi-replay',
    acceptClass: 'p-button-success',
    acceptLabel: 'Sim, devolver',
    rejectLabel: 'Cancelar',
    accept: async () => {
      devolvendo.value = true;
      try {
        await ResponsibilityTermService.devolver(id.value, {
          items: itens.map(({ id: itemId, quantity }) => ({ id: itemId, quantity })),
        });
        toast.add({ severity: 'success', summary: 'Devolução registrada', detail: 'Itens selecionados retornaram ao estoque.', life: 4000 });
        carregar();
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Erro', detail: e?.response?.data?.message || 'Falha ao devolver itens.', life: 4000 });
      } finally {
        devolvendo.value = false;
      }
    },
  });
};

onMounted(carregar);
</script>
