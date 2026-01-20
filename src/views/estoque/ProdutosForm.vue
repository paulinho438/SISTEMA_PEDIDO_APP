<template>
  <div class="card p-5 bg-page">
    <div class="flex align-items-center justify-content-between mb-3">
      <h5 class="text-900 mb-0">{{ isViewMode ? 'Visualizar' : (id ? 'Editar' : 'Novo') }} Produto</h5>
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
          <label for="reference">Referência</label>
          <InputText id="reference" v-model="form.reference" class="w-full" :disabled="isViewMode || !podeEditar" />
        </div>
        <div class="col-12">
          <label for="description">Descrição *</label>
          <InputText id="description" v-model="form.description" class="w-full" :disabled="isViewMode || !podeEditar" required />
        </div>
        <div class="col-12 md:col-6">
          <label for="unit">Unidade *</label>
          <InputText id="unit" v-model="form.unit" class="w-full" :disabled="isViewMode || !podeEditar" required />
        </div>
        <div class="col-12 md:col-6">
          <label for="active">Ativo</label>
          <div class="flex align-items-center mt-2">
            <Checkbox id="active" v-model="form.active" :binary="true" :disabled="isViewMode || !podeEditar" />
            <label for="active" class="ml-2">Produto ativo</label>
          </div>
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
import StockProductService from '@/service/StockProductService';

export default {
  name: 'ProdutosForm',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const permissionService = new PermissionsService();
    const id = route.params.id;
    const isViewMode = computed(() => route.query.view === 'true');
    const service = new StockProductService();

    // Verificar permissões
    const podeVisualizar = computed(() => permissionService.hasPermissions('view_estoque_produtos'));
    const podeEditar = computed(() => permissionService.hasPermissions('view_estoque_produtos_edit'));
    const podeCriar = computed(() => permissionService.hasPermissions('view_estoque_produtos_create'));

    // Verificar se pode acessar a página
    if (!id && !podeCriar.value) {
      toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para criar produtos', life: 3000 });
      router.push('/estoque/produtos');
    }
    
    if (id) {
      if (isViewMode.value && !podeVisualizar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para visualizar produtos', life: 3000 });
        router.push('/estoque/produtos');
      } else if (!isViewMode.value && !podeEditar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para editar produtos', life: 3000 });
        router.push('/estoque/produtos');
      }
    }

    const form = ref({
      code: '',
      reference: '',
      description: '',
      unit: 'UN',
      active: true,
    });
    const salvando = ref(false);

    const carregar = async () => {
      if (id) {
        try {
          const { data } = await service.get(id);
          form.value = data.data || data;
        } catch (error) {
          toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar produto', life: 3000 });
        }
      }
    };

    const salvar = async () => {
      if (isViewMode.value || !podeEditar.value) {
        return;
      }

      if (id && !podeEditar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para editar produtos', life: 3000 });
        return;
      }

      if (!id && !podeCriar.value) {
        toast.add({ severity: 'error', summary: 'Sem permissão', detail: 'Você não tem permissão para criar produtos', life: 3000 });
        return;
      }

      try {
        salvando.value = true;
        await service.save({ ...form.value, id: id || undefined });
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Produto salvo com sucesso', life: 3000 });
        router.push('/estoque/produtos');
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao salvar produto', life: 3000 });
      } finally {
        salvando.value = false;
      }
    };

    const editar = () => {
      router.push(`/estoque/produtos/${id}`);
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

