<template>
  <div class="card p-5 bg-page">
    <div class="flex align-items-center justify-content-between mb-3">
      <h5 class="text-900 mb-0">{{ isViewMode ? 'Visualizar' : (id ? 'Editar' : 'Novo') }} Local</h5>
      <Button 
        v-if="isViewMode && podeEditar"
        label="Editar" 
        icon="pi pi-pencil" 
        class="p-button-outlined"
        @click="editar" 
      />
    </div>

    <form @submit.prevent="salvar">
      <div class="grid">
        <div class="col-12 md:col-6">
          <label for="code">Código *</label>
          <InputText id="code" v-model="form.code" class="w-full" :disabled="isViewMode || !podeEditar" required />
        </div>
        <div class="col-12 md:col-6">
          <label for="active">Ativo</label>
          <div class="flex align-items-center mt-2">
            <Checkbox id="active" v-model="form.active" :binary="true" :disabled="isViewMode || !podeEditar" />
            <label for="active" class="ml-2">Local ativo</label>
          </div>
        </div>
        <div class="col-12">
          <label for="name">Nome *</label>
          <InputText id="name" v-model="form.name" class="w-full" :disabled="isViewMode || !podeEditar" required />
        </div>
        <div class="col-12">
          <label for="address">Endereço</label>
          <Textarea id="address" v-model="form.address" class="w-full" rows="3" :disabled="isViewMode || !podeEditar" />
        </div>
      </div>

      <div class="flex justify-content-end mt-4 gap-2">
        <Button label="Cancelar" class="p-button-outlined" @click="$router.back()" />
        <Button 
          v-if="!isViewMode && podeEditar" 
          label="Salvar" 
          type="submit" 
          :loading="salvando" 
        />
      </div>
    </form>

    <Toast />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import PermissionsService from '@/service/PermissionsService';
import StockLocationService from '@/service/StockLocationService';

export default {
  name: 'LocaisForm',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const permissionService = new PermissionsService();
    const id = route.params.id;
    const isViewMode = computed(() => route.query.view === 'true');
    const service = new StockLocationService();

    // Verificar permissões
    const podeVisualizar = computed(() => permissionService.hasPermissions('view_estoque_locais'));
    const podeEditar = computed(() => permissionService.hasPermissions('view_estoque_locais_edit'));
    const podeCriar = computed(() => permissionService.hasPermissions('view_estoque_locais_create'));

    // Verificar se pode acessar a página
    if (!id && !podeCriar.value) {
      toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para criar locais', life: 3000 });
      router.push('/estoque/locais');
    }
    
    if (id) {
      if (isViewMode.value && !podeVisualizar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para visualizar locais', life: 3000 });
        router.push('/estoque/locais');
      } else if (!isViewMode.value && !podeEditar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para editar locais', life: 3000 });
        router.push('/estoque/locais');
      }
    }

    const form = ref({
      code: '',
      name: '',
      address: '',
      active: true,
    });
    const salvando = ref(false);

    const carregar = async () => {
      if (id) {
        try {
          const { data } = await service.get(id);
          form.value = data.data || data;
        } catch (error) {
          toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar local', life: 3000 });
        }
      }
    };

    const salvar = async () => {
      if (isViewMode.value || !podeEditar.value) {
        return;
      }

      if (id && !podeEditar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para editar locais', life: 3000 });
        return;
      }

      if (!id && !podeCriar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para criar locais', life: 3000 });
        return;
      }

      try {
        salvando.value = true;
        await service.save({ ...form.value, id: id || undefined });
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Local salvo com sucesso', life: 3000 });
        router.push('/estoque/locais');
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao salvar local', life: 3000 });
      } finally {
        salvando.value = false;
      }
    };

    const editar = () => {
      router.push(`/estoque/locais/${id}`);
    };

    onMounted(() => {
      if (id) carregar();
    });

    return {
      id,
      form,
      salvando,
      salvar,
      isViewMode,
      podeEditar,
      podeCriar,
      editar,
    };
  },
};
</script>

