<template>
  <div class="card p-5 bg-page">
    <h5 class="text-900 mb-3">{{ id ? 'Editar' : 'Nova' }} Filial</h5>

    <form @submit.prevent="salvar">
      <div class="grid">
        <div class="col-12 md:col-6">
          <label for="code">Código da Filial</label>
          <InputText
            id="code"
            v-model="form.code"
            class="w-full"
            :disabled="!id"
            :placeholder="id ? undefined : 'Gerado automaticamente'"
          />
        </div>
        <div class="col-12 md:col-6">
          <label for="active">Ativo</label>
          <div class="flex align-items-center mt-2">
            <Checkbox id="active" v-model="form.active" :binary="true" />
            <label for="active" class="ml-2">Filial ativa</label>
          </div>
        </div>
        <div class="col-12">
          <label for="name">Descrição *</label>
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
import AssetAuxiliaryService from '@/service/AssetAuxiliaryService';

export default {
  name: 'FiliaisForm',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const id = route.params.id;
    const service = new AssetAuxiliaryService('filiais');

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
          // Tentar buscar pela lista completa primeiro (com all=true para pegar inativas também)
          const { data } = await service.getAll({ all: true });
          const filiais = data?.data || data || [];
          const filial = filiais.find(f => f.id == id);
          
          if (filial) {
            form.value = {
              code: filial.code || '',
              name: filial.name || '',
              address: filial.address || '',
              active: filial.active !== undefined ? filial.active : true,
            };
          } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: 'Filial não encontrada', life: 3000 });
            router.push('/ativos/filiais');
          }
        } catch (error) {
          toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar filial', life: 3000 });
          router.push('/ativos/filiais');
        }
      }
    };

    const salvar = async () => {
      try {
        salvando.value = true;
        const payload = { ...form.value, id: id || undefined };
        if (!id && !(form.value.code || '').trim()) {
          payload.code = '';
        }
        await service.save(payload);
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Filial salva com sucesso', life: 3000 });
        router.push('/ativos/filiais');
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao salvar filial', life: 3000 });
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

