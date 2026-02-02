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
            <Tag :value="termo.status === 'devolvido' ? 'Devolvido' : 'Aberto'" :severity="termo.status === 'devolvido' ? 'success' : 'warning'" />
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
        <Column field="product.unit" header="Un.">
          <template #body="slotProps">
            {{ slotProps.data.product?.unit ?? 'UN' }}
          </template>
        </Column>
      </DataTable>

      <div class="flex gap-2 mt-4">
        <Button label="Baixar PDF" icon="pi pi-file-pdf" class="p-button-outlined p-button-danger" @click="baixarPdf" />
        <Button
          v-if="termo.status === 'aberto'"
          label="Devolver (retornar ao estoque)"
          icon="pi pi-replay"
          class="p-button-success"
          :loading="devolvendo"
          @click="confirmarDevolver"
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
const id = computed(() => Number(route.params.id));

const formatarData = (v) => {
  if (!v) return '-';
  return new Date(v).toLocaleString('pt-BR');
};

const voltar = () => router.push({ name: 'estoqueTermosResponsabilidade' });

const carregar = async () => {
  if (!id.value) return;
  carregando.value = true;
  try {
    const { data } = await ResponsibilityTermService.get(id.value);
    termo.value = data?.data ?? data;
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
    message: 'Confirmar devolução? Os itens retornarão ao estoque.',
    header: 'Devolver Termo',
    icon: 'pi pi-replay',
    acceptClass: 'p-button-success',
    acceptLabel: 'Sim, devolver',
    rejectLabel: 'Cancelar',
    accept: async () => {
      devolvendo.value = true;
      try {
        await ResponsibilityTermService.devolver(id.value);
        toast.add({ severity: 'success', summary: 'Devolvido', detail: 'Itens retornaram ao estoque.', life: 4000 });
        carregar();
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Erro', detail: e?.response?.data?.message || 'Falha ao devolver.', life: 4000 });
      } finally {
        devolvendo.value = false;
      }
    },
  });
};

onMounted(carregar);
</script>
