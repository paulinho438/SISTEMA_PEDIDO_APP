<template>
  <div class="card p-5 bg-page">
    <h5 class="text-900 mb-3">{{ id ? 'Editar' : 'Nova' }} Descrição Padrão</h5>

    <form @submit.prevent="salvar">
      <div class="grid">
        <div class="col-12 md:col-6">
          <label for="code">Código</label>
          <InputText
            id="code"
            v-model="form.code"
            class="w-full"
            :disabled="!!id"
            :placeholder="id ? undefined : 'Gerado automaticamente'"
          />
        </div>
        <div class="col-12 md:col-6">
          <label for="active">Ativo</label>
          <div class="flex align-items-center mt-2">
            <Checkbox id="active" v-model="form.active" :binary="true" />
            <label for="active" class="ml-2">Descrição ativa</label>
          </div>
        </div>
        <div class="col-12">
          <label for="name">Nome *</label>
          <InputText id="name" v-model="form.name" class="w-full" required />
        </div>
        <div class="col-12">
          <label for="description">Descrição</label>
          <Textarea id="description" v-model="form.description" class="w-full" rows="3" />
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
import { useStore } from 'vuex';
import PermissionsService from '@/service/PermissionsService';
import AssetAuxiliaryService from '@/service/AssetAuxiliaryService';

export default {
  name: 'DescricoesPadraoForm',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const store = useStore();
    const id = route.params.id;
    const service = new AssetAuxiliaryService('descricoes-padrao');
    const permissionService = new PermissionsService();

    const form = ref({
      code: '',
      name: '',
      description: '',
      active: true,
    });
    const salvando = ref(false);

    const carregar = async () => {
      if (id) {
        try {
          const { data } = await service.getAll({ all: true });
          const descricoes = data?.data || data || [];
          const descricao = descricoes.find(d => d.id == id);
          
          if (descricao) {
            form.value = {
              code: descricao.code || '',
              name: descricao.name || '',
              description: descricao.description || '',
              active: descricao.active !== undefined ? descricao.active : true,
            };
          } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: 'Descrição padrão não encontrada', life: 3000 });
            router.push('/ativos/descricoes-padrao');
          }
        } catch (error) {
          toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar descrição padrão', life: 3000 });
          router.push('/ativos/descricoes-padrao');
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
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Descrição padrão salva com sucesso', life: 3000 });
        router.push('/ativos/descricoes-padrao');
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao salvar descrição padrão', life: 3000 });
      } finally {
        salvando.value = false;
      }
    };

    onMounted(() => {
      const permission = id ? 'view_ativos_descricoes_padrao_edit' : 'view_ativos_descricoes_padrao_create';
      if (!permissionService.hasPermissions(permission)) {
        router.push('/');
        return;
      }
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

