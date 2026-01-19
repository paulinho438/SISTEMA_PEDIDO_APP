<template>
    <div class="grid">
        <div class="col-12">
            <div class="card">
                <div class="flex flex-column align-items-center justify-content-center" style="min-height: 50vh;">
                    <div class="text-center mb-5">
                        <div class="logo-container">
                            <img 
                                src="https://www.gruporialma.com.br/assets/logo_sem_fundo-Dbkuj9iO.png" 
                                alt="Logo Rialma" 
                            />
                        </div>
                    </div>
                    <h1 class="text-4xl font-bold mb-3">Bem-vindo ao Sistema de Compras</h1>
                    <p class="text-xl text-color-secondary mb-5">
                        Selecione uma opção no menu lateral para começar
                    </p>
                    <div class="flex flex-wrap gap-3 justify-content-center">
                        <Button 
                            v-if="hasPermission('view_empresas')"
                            label="Empresas" 
                            icon="pi pi-building" 
                            class="p-button-outlined"
                            @click="navigateTo('/empresas')"
                        />
                        <Button 
                            v-if="hasPermission('view_cotacoes')"
                            label="Cotações" 
                            icon="pi pi-shopping-cart" 
                            class="p-button-outlined"
                            @click="navigateTo('/cotacoes')"
                        />
                        <Button 
                            v-if="hasPermission('create_cotacoes')"
                            label="Solicitações" 
                            icon="pi pi-file" 
                            class="p-button-outlined"
                            @click="navigateTo('/solicitacoes')"
                        />
                        <Button 
                            v-if="hasPermission('view_estoque')"
                            label="Estoque" 
                            icon="pi pi-box" 
                            class="p-button-outlined"
                            @click="navigateTo('/estoque/produtos')"
                        />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import Button from 'primevue/button';
import PermissionsService from '@/service/PermissionsService';

const router = useRouter();
const store = useStore();
const permissionsService = new PermissionsService();

const permissions = computed(() => store.getters.permissions || []);

const hasPermission = (permission) => {
    return permissionsService.hasPermissions(permission);
};

const navigateTo = (path) => {
    router.push(path);
};
</script>

<style scoped>
.card {
    padding: 2rem;
}

.logo-container {
    width: 200px;
    height: 80px;
    background-color: rgb(30, 58, 138);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    border-radius: 8px;
    overflow: hidden;
}

.logo-container img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}
</style>

