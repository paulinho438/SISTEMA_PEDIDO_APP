<template>
  <Toast />
  <div class="card p-4">
    <!-- Cabeçalho e ações -->
    <div class="flex justify-content-between align-items-center mb-4">
      <div>
        <Button
            label="Nova Solicitação"
            icon="pi pi-plus"
            class="p-button-success mr-2"
            @click="novaSolicitacao"
        />
        <Button
            label="Deletar"
            icon="pi pi-trash"
            class="p-button-danger mr-2"
            :disabled="!selecionadas.length"
            @click="deletarSelecionadas"
        />
      </div>

      <div class="flex align-items-center">
        <Button
            label="Exportar"
            icon="pi pi-upload"
            class="p-button-outlined mr-3"
            @click="exportar"
        />
        <span class="p-input-icon-left">
                    <i class="pi pi-search" />
                    <InputText
                        v-model="filtroGlobal"
                        placeholder="Buscar..."
                        class="p-inputtext-sm"
                        style="width: 16rem"
                    />
                </span>
      </div>
    </div>

    <!-- Tabela -->
    <DataTable
        :value="filtrarSolicitacoes"
        :paginator="true"
        :rows="perPage"
        dataKey="id"
        responsiveLayout="scroll"
        v-model:selection="selecionadas"
        selectionMode="checkbox"
        :loading="carregando"
    >
      <Column selectionMode="multiple" headerStyle="width:3rem"></Column>
      <Column field="numero" header="Nº da Solicitação" sortable></Column>
      <Column field="data" header="Data" sortable></Column>
      <Column field="solicitante" header="Solicitante" sortable></Column>
      <Column field="centroCusto" header="Centro de Custo" sortable></Column>
      <Column field="frenteObra" header="Frente de Obra" sortable></Column>

      <Column header="Status" sortable>
        <template #body="slotProps">
          <Tag
              :value="slotProps.data.status"
              :severity="mapaStatus[slotProps.data.statusSlug] || 'secondary'"
              :style="statusStyle(slotProps.data.statusSlug)"
          />
        </template>
      </Column>

      <Column header="Ações" style="width: 10rem">
        <template #body="slotProps">
          <div class="flex justify-content-around">
            <Button
                icon="pi pi-eye"
                class="p-button-rounded p-button-text"
                @click="visualizar(slotProps.data)"
            />
            <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-text p-button-success"
                @click="editar(slotProps.data)"
            />
            <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-text p-button-danger"
                @click="excluir(slotProps.data)"
            />
          </div>
        </template>
      </Column>
    </DataTable>

    <!-- Rodapé -->
    <div class="flex justify-content-between align-items-center mt-3 text-sm text-500">
            <span>
                Mostrando {{ (paginaAtual - 1) * perPage + 1 }} a
                {{ Math.min(paginaAtual * perPage, solicitacoes.length) }} de
                {{ solicitacoes.length }} solicitações
            </span>

      <Dropdown
          v-model="perPage"
          :options="[10, 20, 30]"
          class="w-6rem"
      />
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useRouter } from 'vue-router';
import SolicitacaoService from '@/service/SolicitacaoService';

export default {
  name: 'CicomList',
  setup() {
    const toast = useToast();
    const router = useRouter();

    const solicitacoes = ref([]);
    const filtroGlobal = ref('');
    const selecionadas = ref([]);
    const perPage = ref(10);
    const paginaAtual = ref(1);
    const carregando = ref(false);

    const mapaStatus = {
      aguardando: 'warning',
      autorizado: 'info',
      cotacao: 'warning',
      compra_em_andamento: 'info',
      finalizada: 'info',
      analisada: 'help',
      analisada_aguardando: 'help',
      analise_gerencia: 'info',
      aprovado: 'success',
    };

    const carregarSolicitacoes = async () => {
      try {
        carregando.value = true;
        const { data } = await SolicitacaoService.list({ per_page: 100 });
        solicitacoes.value = (data?.data || []).map((item) => ({
          id: item.id,
          numero: item.numero,
          data: item.data,
          solicitante: item.solicitante,
          centroCusto: item.centro_custo,
          frenteObra: item.frente_obra,
          status: item.status?.label,
          statusSlug: item.status?.slug,
        }));
      } catch (error) {
        const detail = error?.response?.data?.message || 'Não foi possível carregar as solicitações.';
        toast.add({ severity: 'error', summary: 'Erro ao carregar', detail, life: 4000 });
      } finally {
        carregando.value = false;
      }
    };

    onMounted(carregarSolicitacoes);

    const filtrarSolicitacoes = computed(() => {
      if (!filtroGlobal.value) return solicitacoes.value;
      return solicitacoes.value.filter((s) =>
        Object.values(s)
          .join(' ')
          .toLowerCase()
          .includes(filtroGlobal.value.toLowerCase())
      );
    });

    const novaSolicitacao = () => router.push({ name: 'solicitacoesAdd' });
    const exportar = () => toast.add({ severity: 'info', summary: 'Exportar', detail: 'Exportação simulada...', life: 2000 });
    const visualizar = (item) => toast.add({ severity: 'info', summary: 'Visualizar', detail: `Visualizando ${item.numero}`, life: 2000 });
    const editar = (item) => router.push({ name: 'solicitacoesEdit', params: { id: item.id } });
    const excluir = (item) => toast.add({ severity: 'warn', summary: 'Excluir', detail: `Excluído ${item.numero}`, life: 2000 });
    const deletarSelecionadas = () => {
      toast.add({
        severity: 'warn',
        summary: 'Deletar Selecionadas',
        detail: `${selecionadas.value.length} solicitações removidas.`,
        life: 2000,
      });
      selecionadas.value = [];
    };

    const statusStyle = (slug) => {
      const styles = {
        aguardando: { backgroundColor: '#FFEED0', color: '#C47F17' },
        autorizado: { backgroundColor: '#CDE7FF', color: '#1363B4' },
        cotacao: { backgroundColor: '#FFEED0', color: '#C47F17' },
        compra_em_andamento: { backgroundColor: '#CDE7FF', color: '#1363B4' },
        finalizada: { backgroundColor: '#E0D5FF', color: '#5E37B4' },
        analisada: { backgroundColor: '#BFF3E0', color: '#0F8558' },
        analisada_aguardando: { backgroundColor: '#F3F0C7', color: '#9C8A1F' },
        analise_gerencia: { backgroundColor: '#FAD7DF', color: '#B61643' },
        aprovado: { backgroundColor: '#CFF5D8', color: '#237A3F' },
      };

      return styles[slug] ?? { backgroundColor: '#E7E9EE', color: '#475569' };
    };

    return {
      solicitacoes,
      filtroGlobal,
      selecionadas,
      perPage,
      paginaAtual,
      filtrarSolicitacoes,
      mapaStatus,
      statusStyle,
      novaSolicitacao,
      exportar,
      visualizar,
      editar,
      excluir,
      deletarSelecionadas,
      carregando,
    };
  },
};
</script>

<style scoped>
.card {
  border-radius: 10px;
  background: #fff;
}

/* Tabela limpa */
:deep(.p-datatable) {
  border: none !important;
}

:deep(.p-tag-success) {
  background-color: #e7f8ec !important;
  color: #0f7c2f !important;
  border-radius: 10px;
  padding: 0.3rem 1rem;
}
:deep(.p-tag-info) {
  background-color: #e7f2fa !important;
  color: #0c60b9 !important;
  border-radius: 10px;
  padding: 0.3rem 1rem;
}
:deep(.p-tag-danger) {
  background-color: #fae7e7 !important;
  color: #c02424 !important;
  border-radius: 10px;
  padding: 0.3rem 1rem;
}
</style>
