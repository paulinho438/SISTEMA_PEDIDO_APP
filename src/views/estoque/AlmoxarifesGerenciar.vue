<template>
  <div class="card p-5 bg-page">
    <h5 class="text-900 mb-3">Gerenciar Almoxarifes</h5>
    <p class="text-600 mb-4">Associe almoxarifes aos locais de estoque que eles podem gerenciar.</p>

    <TabView>
      <TabPanel header="Por Local">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label for="local">Local</label>
            <Dropdown
              id="local"
              v-model="localSelecionado"
              :options="locais"
              optionLabel="name"
              optionValue="id"
              placeholder="Selecione um local"
              class="w-full"
              @change="carregarAlmoxarifesDoLocal"
            />
          </div>
        </div>

        <div v-if="localSelecionado" class="mt-3">
          <h6>Almoxarifes deste local:</h6>
          <DataTable :value="almoxarifesLocal" :paginator="false" class="p-datatable-sm">
            <Column field="nome_completo" header="Nome"></Column>
            <Column field="email" header="Email"></Column>
            <Column header="Ações">
              <template #body="slotProps">
                <Button
                  icon="pi pi-trash"
                  class="p-button-rounded p-button-text p-button-danger"
                  @click="removerAlmoxarifeDoLocal(slotProps.data.id)"
                />
              </template>
            </Column>
          </DataTable>

          <div class="mt-3">
            <label>Adicionar Almoxarife</label>
            <Dropdown
              v-model="almoxarifeParaAdicionar"
              :options="usuariosAlmoxarifes"
              optionLabel="nome_completo"
              optionValue="id"
              placeholder="Selecione um almoxarife"
              class="w-full"
              :filter="true"
              filterPlaceholder="Buscar usuário"
            >
              <template #option="slotProps">
                <div>
                  <span>{{ slotProps.option.nome_completo }}</span>
                  <Tag v-if="!slotProps.option.has_permission_almoxarife" value="Sem permissão" severity="warning" class="ml-2" />
                </div>
              </template>
            </Dropdown>
            <Button label="Adicionar" class="mt-2" @click="adicionarAlmoxarifeAoLocal" />
          </div>
        </div>
      </TabPanel>

      <TabPanel header="Por Almoxarife">
        <div class="grid">
          <div class="col-12 md:col-6">
            <label for="almoxarife">Almoxarife</label>
            <Dropdown
              id="almoxarife"
              v-model="almoxarifeSelecionado"
              :options="usuariosAlmoxarifes"
              optionLabel="nome_completo"
              optionValue="id"
              placeholder="Selecione um almoxarife"
              class="w-full"
              :filter="true"
              filterPlaceholder="Buscar usuário"
              @change="carregarLocaisDoAlmoxarife"
            >
              <template #option="slotProps">
                <div>
                  <span>{{ slotProps.option.nome_completo }}</span>
                  <Tag v-if="!slotProps.option.has_permission_almoxarife" value="Sem permissão" severity="warning" class="ml-2" />
                </div>
              </template>
            </Dropdown>
          </div>
        </div>

        <div v-if="almoxarifeSelecionado" class="mt-3">
          <h6>Locais deste almoxarife:</h6>
          <DataTable :value="locaisAlmoxarife" :paginator="false" class="p-datatable-sm">
            <Column field="code" header="Código"></Column>
            <Column field="name" header="Nome"></Column>
            <Column header="Ações">
              <template #body="slotProps">
                <Button
                  icon="pi pi-trash"
                  class="p-button-rounded p-button-text p-button-danger"
                  @click="removerLocalDoAlmoxarife(slotProps.data.id)"
                />
              </template>
            </Column>
          </DataTable>

          <div class="mt-3">
            <label>Adicionar Locais</label>
            <MultiSelect
              v-model="locaisParaAdicionar"
              :options="locais"
              optionLabel="name"
              optionValue="id"
              placeholder="Selecione os locais"
              class="w-full"
            />
            <Button label="Adicionar" class="mt-2" @click="adicionarLocaisAoAlmoxarife" />
          </div>
        </div>
      </TabPanel>
    </TabView>

    <Toast />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';
import StockLocationService from '@/service/StockLocationService';
import StockAlmoxarifeService from '@/service/StockAlmoxarifeService';
import UserService from '@/service/UserService';

export default {
  name: 'AlmoxarifesGerenciar',
  setup() {
    const toast = useToast();
    const locais = ref([]);
    const usuariosAlmoxarifes = ref([]);
    const localSelecionado = ref(null);
    const almoxarifeSelecionado = ref(null);
    const almoxarifesLocal = ref([]);
    const locaisAlmoxarife = ref([]);
    const almoxarifeParaAdicionar = ref(null);
    const locaisParaAdicionar = ref([]);

    const locationService = new StockLocationService();
    const almoxarifeService = new StockAlmoxarifeService();
    const userService = new UserService();

    const carregarLocais = async () => {
      try {
        const { data } = await locationService.getAll({ per_page: 100 });
        locais.value = data.data || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar locais', life: 3000 });
      }
    };

    const carregarUsuarios = async () => {
      try {
        // Buscar todos os usuários da empresa
        const { data } = await almoxarifeService.listAlmoxarifes();
        usuariosAlmoxarifes.value = data || [];
        
        // Se não houver usuários com permissão, mostrar aviso
        const usersWithPermission = (data || []).filter(u => u.has_permission_almoxarife);
        if (usersWithPermission.length === 0 && (data || []).length > 0) {
          toast.add({ 
            severity: 'warn', 
            summary: 'Atenção', 
            detail: 'Nenhum usuário possui a permissão "almoxarife". Atribua essa permissão a um usuário primeiro.', 
            life: 5000 
          });
        }
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar usuários', life: 3000 });
      }
    };

    const carregarAlmoxarifesDoLocal = async () => {
      if (!localSelecionado.value) return;
      try {
        const { data } = await almoxarifeService.listByLocation(localSelecionado.value);
        almoxarifesLocal.value = data.almoxarifes || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar almoxarifes', life: 3000 });
      }
    };

    const carregarLocaisDoAlmoxarife = async () => {
      if (!almoxarifeSelecionado.value) return;
      try {
        const { data } = await almoxarifeService.listByAlmoxarife(almoxarifeSelecionado.value);
        locaisAlmoxarife.value = data.locations || [];
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar locais', life: 3000 });
      }
    };

    const adicionarAlmoxarifeAoLocal = async () => {
      if (!almoxarifeParaAdicionar.value || !localSelecionado.value) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione um almoxarife', life: 3000 });
        return;
      }
      try {
        await almoxarifeService.associate(localSelecionado.value, almoxarifeParaAdicionar.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Almoxarife associado com sucesso', life: 3000 });
        almoxarifeParaAdicionar.value = null;
        await carregarAlmoxarifesDoLocal();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao associar almoxarife', life: 3000 });
      }
    };

    const removerAlmoxarifeDoLocal = async (userId) => {
      try {
        await almoxarifeService.disassociate(localSelecionado.value, userId);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Associação removida com sucesso', life: 3000 });
        await carregarAlmoxarifesDoLocal();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao remover associação', life: 3000 });
      }
    };

    const adicionarLocaisAoAlmoxarife = async () => {
      if (!locaisParaAdicionar.value?.length || !almoxarifeSelecionado.value) {
        toast.add({ severity: 'warn', summary: 'Atenção', detail: 'Selecione ao menos um local', life: 3000 });
        return;
      }
      try {
        await almoxarifeService.associateMultiple(almoxarifeSelecionado.value, locaisParaAdicionar.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Locais associados com sucesso', life: 3000 });
        locaisParaAdicionar.value = [];
        await carregarLocaisDoAlmoxarife();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao associar locais', life: 3000 });
      }
    };

    const removerLocalDoAlmoxarife = async (locationId) => {
      try {
        await almoxarifeService.disassociate(locationId, almoxarifeSelecionado.value);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Associação removida com sucesso', life: 3000 });
        await carregarLocaisDoAlmoxarife();
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao remover associação', life: 3000 });
      }
    };

    onMounted(() => {
      carregarLocais();
      carregarUsuarios();
    });

    return {
      locais,
      usuariosAlmoxarifes,
      localSelecionado,
      almoxarifeSelecionado,
      almoxarifesLocal,
      locaisAlmoxarife,
      almoxarifeParaAdicionar,
      locaisParaAdicionar,
      carregarAlmoxarifesDoLocal,
      carregarLocaisDoAlmoxarife,
      adicionarAlmoxarifeAoLocal,
      removerAlmoxarifeDoLocal,
      adicionarLocaisAoAlmoxarife,
      removerLocalDoAlmoxarife,
    };
  },
};
</script>

