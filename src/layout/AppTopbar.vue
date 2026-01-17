<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import { useRouter } from 'vue-router';
import AuthService from '@/service/AuthService';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import ClientService from '@/service/ClientService';


import { ToastSeverity } from 'primevue/api';
import store from "@/store";

const { layoutConfig, onMenuToggle, contextPath } = useLayout();

const clientService = new ClientService();

const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);
const router = useRouter();
const authService = new AuthService();
const toast = useToast();
const confirmPopup = useConfirm();

onMounted(() => {
    bindOutsideClickListener();
});

onBeforeUnmount(() => {
    unbindOutsideClickListener();
});

const logoUrl = computed(() => {
    return `${contextPath}layout/images/${layoutConfig.darkTheme.value ? 'logo' : 'logo'}.png`;
});

const onTopBarMenuButton = () => {
    topbarMenuActive.value = !topbarMenuActive.value;
};
const topbarMenuClasses = computed(() => {
    return {
        'layout-topbar-menu-mobile-active': topbarMenuActive.value
    };
});


const changed = ref(false);
const selectedTipo = ref('');

const companiesList = ref([]);


const bindOutsideClickListener = () => {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                topbarMenuActive.value = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
};
const unbindOutsideClickListener = () => {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener);
        outsideClickListener.value = null;
    }
};
const isOutsideClicked = (event) => {
    if (!topbarMenuActive.value) return;

    const sidebarEl = document.querySelector('.layout-topbar-menu');
    const topbarEl = document.querySelector('.layout-topbar-menu-button');

    return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};

const logout = async () => {
    try {
        const response = authService.logout();
        localStorage.removeItem('app.190.token');
        localStorage.removeItem('changed');
        router.push({ name: 'login' });
    } catch (e) {
        console.log(e.message);
    }
};

const confirm = (event) => {
    confirmPopup.require({
        target: event.target,
        message: 'Tem certeza que deseja cobrar todos os clientes?',
        icon: 'pi pi-exclamation-triangle',
		acceptLabel: 'Sim',
        rejectLabel: 'Não',
        accept: () => {
			cobrarTodosClientes();
        },
        reject: () => {
            toast.add({ severity: 'info', summary: 'Cancelar', detail: 'Rotina não iniciada!', life: 3000 });
        }
    });
};

const cobrarTodosClientes = async (event) => {

	try {
		
		await clientService.cobrarClientes();

        alert('Clientes cobrados com sucesso!');

		toast.add({ severity: 'success', summary: 'Sucesso', detail: 'Clientes cobrados com sucesso!', life: 3000 });

	} catch (e) {
        alert('Rotina já foi iniciada!');
		toast.add({ severity: 'error', summary: 'Erro', detail: 'Rotina já foi iniciada!', life: 3000 });
	}

};

const searchCostcenter = async (event) => {
    try {
        console.log(store?.getters?.companies);
        console.log(event.query.toLowerCase());

        companiesList.value = store?.getters?.companies.filter((company) =>
            company.company.toLowerCase().includes(event.query.toLowerCase())
        );

    } catch (e) {
        console.log(e);
    }
}

const changeCompany = async () => {
    const selected = selectedTipo.value;

    if (selected?.id) {
        store.commit('setCompany', selected);

        const res = store.getters?.allPermissions.filter(item => item.company_id === selected.id);
        store.commit('setPermissions', res[0]?.permissions ?? []);

        window.location.reload();
    } else {
        toast.add({
            severity: 'error',
            summary: 'Atenção',
            detail: 'Selecione uma empresa!',
            life: 3000
        });
    }
};

const userName = computed(() => {
    return store.getters?.usuario?.nome_completo || store.getters?.usuario?.login || 'Usuário';
});

const userProfile = computed(() => {
    const companyId = store.getters?.isCompany?.id;
    if (!companyId || !store.getters?.allPermissions) return '';
    
    const companyIdNum = Number(companyId);
    const permission = store.getters.allPermissions.find(item => Number(item.company_id) === companyIdNum);
    return permission?.name || '';
});


</script>

<template>
    <div class="layout-topbar">
        <router-link to="/" class="layout-topbar-logo">
            <div class="logo-rialma">
                <img src="https://www.gruporialma.com.br/assets/logo_sem_fundo-Dbkuj9iO.png" alt="Logo Rialma" />
            </div>
        </router-link>

        <button class="p-link layout-menu-button layout-topbar-button" @click="onMenuToggle()">
            <i class="pi pi-bars"></i>
        </button>

        <button class="p-link layout-topbar-menu-button layout-topbar-button" @click="onTopBarMenuButton()">
            <button @click="logout()" class="p-link layout-topbar-button" style="margin-left: 10px">
                <i class="pi pi-sign-out"></i>
                <span>Logout</span>
            </button>
        </button>


		<ConfirmPopup></ConfirmPopup>

        <div style="display: flex; flex: 1; gap: 20px; flex-direction: row; justify-content: end; align-items: center">
            <div class="hidden-on-small user-info" style="display: flex; flex-direction: column; align-items: flex-end; margin-right: 10px">
                <span style="font-weight: 600; color: var(--text-color); font-size: 0.9rem">{{ userName }}</span>
                <span v-if="userProfile" style="font-size: 0.75rem; color: var(--text-color-secondary)">{{ userProfile }}</span>
            </div>
            <button  v-if="store?.getters?.companies.length > 1" @click="() => {changed = true}" class="p-link hidden-on-small">
                <i class="pi pi-link" style="margin-right: 10px"></i>
                <span>Alterar Empresa</span>
            </button>
            <div class="hidden-on-small">
            <button @click="logout()" class="p-link layout-topbar-button hidden-on-small" style="margin-left: 10px">
                <i class="pi pi-sign-out"></i>
                <span>Logout</span>
            </button>
        </div>
        </div>
    </div>

    <Dialog header="Selecione a Empresa" modal class="w-8 mx-8" v-model:visible="changed" :closable="true">
        <div class="grid flex align-content-center flex-wrap">
            <div class="col-12 flex align-content-center flex-wrap md:col-2 lg:col-1">
                <label>Empresa:</label>
            </div>
            <div class="col-12 flex align-content-center flex-wrap sm:col-12 md:col-8">
                <AutoComplete
                    :modelValue="selectedTipo"
                    :dropdown="true"
                    v-model="selectedTipo"
                    :suggestions="companiesList"
                    placeholder="Informe o nome da Empresa"
                    class="w-full"
                    inputClass="w-full p-inputtext-sm"
                    @complete="searchCostcenter($event)"
                    optionLabel="company"
                />
            </div>
            <div class="col-12 flex align-content-center flex-wrap md:col-12 lg:col-3">
                <Button icon="pi pi-check" label="Entrar" class="p-button-sm p-button-sucess w-full" @click.prevent="changeCompany"  />
            </div>
        </div>
    </Dialog>
</template>

<style lang="scss" scoped>
.hidden-on-small {
    display: block;
}

.user-info {
    display: flex;
}

.logo-rialma {
    width: 120px;
    height: 50px;
    background-color: rgb(30, 58, 138);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5px;
    border-radius: 8px;
    overflow: hidden;
}

.logo-rialma img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

@media (max-width: 991px) {
    .hidden-on-small {
        display: none;
    }
    
    .user-info {
        display: none;
    }
}
</style>
