<template>
  <div class="card p-5 bg-page">
    <h5 class="text-900 mb-3">{{ id ? 'Editar' : 'Novo' }} Local</h5>

    <form @submit.prevent="salvar">
      <div class="grid">
        <div class="col-12 md:col-6">
          <label for="code">Código *</label>
          <InputText id="code" v-model="form.code" class="w-full" required />
        </div>
        <div class="col-12 md:col-6">
          <label for="active">Ativo</label>
          <div class="flex align-items-center mt-2">
            <Checkbox id="active" v-model="form.active" :binary="true" />
            <label for="active" class="ml-2">Local ativo</label>
          </div>
        </div>
        <div class="col-12">
          <label for="name">Nome *</label>
          <InputText id="name" v-model="form.name" class="w-full" required />
        </div>
        <div class="col-12">
          <label for="address">Endereço</label>
          <Textarea id="address" v-model="form.address" class="w-full" rows="3" />
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
import StockLocationService from '@/service/StockLocationService';

export default {
  name: 'LocaisForm',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const id = route.params.id;
    const service = new StockLocationService();

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

