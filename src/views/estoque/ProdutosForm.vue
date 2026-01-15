<template>
  <div class="card p-5 bg-page">
    <h5 class="text-900 mb-3">{{ id ? 'Editar' : 'Novo' }} Produto</h5>

    <form @submit.prevent="salvar">
      <div class="grid">
        <div class="col-12 md:col-6">
          <label for="code">Código *</label>
          <InputText id="code" v-model="form.code" class="w-full" required />
        </div>
        <div class="col-12 md:col-6">
          <label for="reference">Referência</label>
          <InputText id="reference" v-model="form.reference" class="w-full" />
        </div>
        <div class="col-12">
          <label for="description">Descrição *</label>
          <InputText id="description" v-model="form.description" class="w-full" required />
        </div>
        <div class="col-12 md:col-6">
          <label for="unit">Unidade *</label>
          <InputText id="unit" v-model="form.unit" class="w-full" required />
        </div>
        <div class="col-12 md:col-6">
          <label for="active">Ativo</label>
          <div class="flex align-items-center mt-2">
            <Checkbox id="active" v-model="form.active" :binary="true" />
            <label for="active" class="ml-2">Produto ativo</label>
          </div>
        </div>
      </div>

      <div class="flex justify-content-end mt-4 gap-2">
        <Button label="Cancelar" class="p-button-outlined" @click="$router.back()" />
        <Button label="Salvar" type="submit" :loading="salvando" />
      </div>
    </form>

    <Toast />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import StockProductService from '@/service/StockProductService';

export default {
  name: 'ProdutosForm',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const id = route.params.id;
    const service = new StockProductService();

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

    onMounted(() => {
      if (id) carregar();
    });

    return {
      id,
      form,
      salvando,
      salvar,
    };
  },
};
</script>

