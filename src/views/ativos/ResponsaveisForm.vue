<template>
  <div class="card p-5 bg-page">
    <h5 class="text-900 mb-3">{{ id ? 'Editar' : 'Novo' }} Responsável de Ativo</h5>

    <form @submit.prevent="salvar">
      <div class="grid">
        <div class="col-12 md:col-6">
          <label for="code">Código do Responsável</label>
          <InputText id="code" v-model="form.code" class="w-full" :disabled="true" placeholder="Gerado automaticamente" />
        </div>
        <div class="col-12 md:col-6">
          <label for="active">Ativo</label>
          <div class="flex align-items-center mt-2">
            <Checkbox id="active" v-model="form.active" :binary="true" />
            <label for="active" class="ml-2">Responsável ativo</label>
          </div>
        </div>
        <div class="col-12 md:col-6">
          <label for="name">Nome *</label>
          <InputText id="name" v-model="form.name" class="w-full" required />
        </div>
        <div class="col-12 md:col-6">
          <label for="matricula">Matrícula</label>
          <InputText id="matricula" v-model="form.matricula" class="w-full" placeholder="Matrícula do responsável" />
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
import AssetAuxiliaryService from '@/service/AssetAuxiliaryService';

export default {
  name: 'ResponsaveisForm',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const id = route.params.id;
    const service = new AssetAuxiliaryService('responsaveis');

    const form = ref({
      code: '', // Será gerado automaticamente pelo backend se vazio
      name: '',
      matricula: '',
      description: '',
      active: true,
    });
    const salvando = ref(false);

    const carregar = async () => {
      if (id) {
        try {
          // Tentar buscar pela lista completa primeiro (com all=true para pegar inativas também)
          const { data } = await service.getAll({ all: true });
          const responsaveis = data?.data || data || [];
          const responsavel = responsaveis.find(r => r.id == id);
          
          if (responsavel) {
            form.value = {
              code: responsavel.code || '',
              name: responsavel.name || '',
              matricula: responsavel.matricula || '',
              description: responsavel.description || '',
              active: responsavel.active !== undefined ? responsavel.active : true,
            };
          } else {
            toast.add({ severity: 'error', summary: 'Erro', detail: 'Responsável não encontrado', life: 3000 });
            router.push('/ativos/responsaveis');
          }
        } catch (error) {
          toast.add({ severity: 'error', summary: 'Erro', detail: 'Erro ao carregar responsável', life: 3000 });
          router.push('/ativos/responsaveis');
        }
      }
    };

    const salvar = async () => {
      try {
        salvando.value = true;
        const dataToSave = { ...form.value };
        
        // Se estiver criando novo (sem id), não enviar o código (será gerado automaticamente)
        if (!id) {
          delete dataToSave.code;
        }
        
        await service.save({ ...dataToSave, id: id || undefined });
        toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Responsável salvo com sucesso', life: 3000 });
        router.push('/ativos/responsaveis');
      } catch (error) {
        toast.add({ severity: 'error', summary: 'Erro', detail: error.response?.data?.message || 'Erro ao salvar responsável', life: 3000 });
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
