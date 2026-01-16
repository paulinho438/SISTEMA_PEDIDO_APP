<script>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import UtilService from '@/service/UtilService';
import PermissionsService from '@/service/PermissionsService';

import { ToastSeverity, PrimeIcons } from 'primevue/api';
// import City from '../cities/City.vue';

import LoadingComponent from '../../components/Loading.vue';
import { useToast } from 'primevue/usetoast';

export default {
    name: 'cicomForm',
    setup() {
        return {
            route: useRoute(),
            router: useRouter(),
            permissionsService: new PermissionsService(),
            icons: PrimeIcons,
            toast: useToast()
        };
    },
    // components: {
    // 	City, LoadingComponent
    // },
    data() {
        return {
            cicom: ref({}),
            oldCicom: ref(null),
            errors: ref([]),
            loading: ref(false),
            multiselectValueUsers: ref(null),
            multiselectValueDashboard: ref(null),
            multiselectValueEmpresa: ref(null),
            multiselectValueUsuario: ref(null),
            multiselectValuePermissoes: ref(null),
            multiselectValues: ref([]),
            checkboxValue: ref([]),
            users: ref([])
        };
    },
    methods: {
        setOldCicom() {
            if (this.cicom?.id) {
                this.oldCicom = {
                    id: this.cicom.id
                };
            }
        },
        changeLoading() {
            this.loading = !this.loading;
        },
        getUsers() {
            this.users = ref([]);
            this.loading = true;
            this.permissionsService
                .getAllUsers()
                .then((response) => {
                    this.users = response.data.data;
                })
                .catch((error) => {
                    this.toast.add({
                        severity: ToastSeverity.ERROR,
                        detail: UtilService.message(e),
                        life: 3000
                    });
                })
                .finally(() => {
                    this.loading = false;
                    this.setOldCicom();
                });
        },
        getGroup() {
            if (this.route.params?.id) {
                this.cicom = ref(null);
                this.loading = true;
                this.permissionsService
                    .get(this.route.params.id)
                    .then((response) => {
                        this.cicom = response.data.data;
                        this.multiselectValueUsers = response.data.data.users;

                        console.log('cicom', response.data);
                    })
                    .catch((e) => {
                        this.toast.add({
                            severity: ToastSeverity.ERROR,
                            detail: UtilService.message(e),
                            life: 3000
                        });
                    })
                    .finally(() => {
                        this.loading = false;
                        this.setOldCicom();
                    });
            }
        },
        getItems() {
            this.multiselectValues = ref(null);
            this.loading = true;
            this.permissionsService
                .getItems()
                .then((response) => {
                    this.multiselectValues = response.data;
                })
                .catch((error) => {
                    this.toast.add({
                        severity: ToastSeverity.ERROR,
                        detail: UtilService.message(e),
                        life: 3000
                    });
                })
                .finally(() => {
                    this.loading = false;
                    this.setOldCicom();
                });
        },
        getItemsGroup() {
            this.multiselectValue = ref(null);
            this.multiselectValueDashboard = ref(null);
            this.multiselectValueEmpresa = ref(null);
            this.multiselectValueUsuario = ref(null);
            this.multiselectValuePermissoes = ref(null);
            this.checkboxValue = ref([]);

            if (this.route.params?.id) {
                this.loading = true;
                this.permissionsService
                    .getItemsGroup(this.route.params.id)
                    .then((response) => {
                        this.checkboxValue = response.data?.data;
                    })
                    .catch((error) => {
                        this.toast.add({
                            severity: ToastSeverity.ERROR,
                            detail: UtilService.message(e),
                            life: 3000
                        });
                    })
                    .finally(() => {
                        this.loading = false;
                        this.setOldCicom();
                    });
            }
        },
        back() {
            this.router.push(`/permissoes`);
        },
        changeEnabled(enabled) {
            this.cicom.enabled = enabled;
        },
        save() {
            this.changeLoading();
            this.errors = [];

            this.cicom.permissions = this.checkboxValue;

            this.cicom.users = this.multiselectValueUsers;

            this.permissionsService
                .save(this.cicom)
                .then((response) => {
                    if (undefined != response.data.data) {
                        this.cicom = response.data.data;
                    }

                    this.toast.add({
                        severity: ToastSeverity.SUCCESS,
                        detail: this.cicom?.id ? 'Dados alterados com sucesso!' : 'Dados inseridos com sucesso!',
                        life: 3000
                    });

                    setTimeout(() => {
                        this.router.push({ name: 'permissionsList' });
                    }, 1200);
                })
                .catch((error) => {
                    this.changeLoading();
                    this.errors = error?.response?.data?.errors;

                    // if (error?.response?.status != 422) {
                    // 	this.toast.add({
                    // 		severity: ToastSeverity.ERROR,
                    // 		detail: UtilService.message(error.response.data),
                    // 		life: 3000
                    // 	});
                    // }

                    this.changeLoading();
                })
                .finally(() => {
                    this.changeLoading();
                });
        },
        clearCicom() {
            this.loading = true;
        },
        addCityBeforeSave(city) {
            // this.cicom.cities.push(city);
            this.changeLoading();
        },
        selecionarTodos(sectionKey) {
            if (!this.multiselectValues || !this.multiselectValues[sectionKey]) {
                return;
            }
            
            const sectionItems = this.multiselectValues[sectionKey];
            const slugsToAdd = sectionItems.map(item => item.slug);
            
            // Adicionar apenas os que não estão selecionados
            slugsToAdd.forEach(slug => {
                if (!this.checkboxValue.includes(slug)) {
                    this.checkboxValue.push(slug);
                }
            });
        },
        desselecionarTodos(sectionKey) {
            if (!this.multiselectValues || !this.multiselectValues[sectionKey]) {
                return;
            }
            
            const sectionItems = this.multiselectValues[sectionKey];
            const slugsToRemove = sectionItems.map(item => item.slug);
            
            // Remover apenas os que estão selecionados
            this.checkboxValue = this.checkboxValue.filter(slug => !slugsToRemove.includes(slug));
        },
        getUniqueItemsBySlug(items) {
            if (!items || !Array.isArray(items)) {
                return [];
            }
            const seen = new Map();
            const result = items.filter(item => {
                if (!item || !item.slug) {
                    return false;
                }
                const slug = String(item.slug).toLowerCase().trim();
                if (seen.has(slug)) {
                    // Se já vimos este slug, não incluir novamente
                    return false;
                }
                // Marcar como visto e incluir
                seen.set(slug, item);
                return true;
            });
            return result;
        }
    },
    computed: {
        title() {
            return this.route.params?.id ? 'Editar Permissão' : 'Criar Permissão';
        }
    },
    mounted() {
        this.permissionsService.hasPermissionsView('view_permissions_edit');
        this.getUsers();
        this.getGroup();
        this.getItems();
        this.getItemsGroup();
    }
};
</script>

<template>
    <Toast />
    <!-- <LoadingComponent :loading="loading" /> -->
    <div class="grid flex flex-wrap mb-3 px-4 pt-2">
        <div class="col-8 px-0 py-0">
            <h5 class="px-0 py-0 align-self-center m-2"><i :class="icons.BUILDING"></i> {{ title }}</h5>
        </div>
        <div class="col-4 px-0 py-0 text-right">
            <Button label="Voltar" class="p-button-outlined p-button-secondary p-button-sm" :icon="icons.ANGLE_LEFT" @click.prevent="back" />
            <Button label="Salvar" class="p-button p-button-info p-button-sm ml-3" :icon="icons.SAVE" type="button" @click.prevent="save" />
        </div>
    </div>
    <Card>
        <template #content>
            <div class="formgrid grid">
                <div class="field col-12 md:col-12 lg:col-12 xl:col-12">
                    <label for="name">Nome</label>
                    <InputText :modelValue="cicom?.name" v-model="cicom.name" id="name" type="text" class="w-full p-inputtext-sm" :class="{ 'p-invalid': errors?.name }" />
                    <small v-if="errors?.name" class="text-red-500 pl-2">{{ errors?.name[0] }}</small>
                </div>
            </div>

            <!-- <div class="formgrid grid">
                <div class="field col-12 md:col-12 lg:col-12 xl:col-12">
                    <label for="name">Usuários</label>
                </div>
                <div class="field col-12 md:col-12 lg:col-12 xl:col-12">
                    <MultiSelect v-model="multiselectValueUsers" class="-mt-8" :options="users" optionLabel="company" placeholder="Selecione os Usuários" :filter="true">
                        <template #value="slotProps">
                            <div class="inline-flex align-items-center py-1 px-2 bg-primary text-primary border-round mr-2" v-for="option of slotProps.value" :key="option.company">
                                <div>{{ option.nome_completo }}</div>
                            </div>
                            <template v-if="!slotProps.value || slotProps.value.length === 0">
                                <div class="p-1">Selecione as Empresas</div>
                            </template>
                        </template>
                        <template #option="slotProps">
                            <div class="flex align-items-center">
                                <div>{{ slotProps.option.nome_completo }}</div>
                            </div>
                        </template>
                    </MultiSelect>
                </div>
            </div> -->

            <div class="flex justify-content-between align-items-center mb-2">
                <h5 class="m-0">Dashboard</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('dashboard')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('dashboard')" />
                </div>
            </div>
            <div class="grid">
                <div class="col-12 md:col-4" v-for="option of multiselectValues?.dashboard" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>
            <div class="flex justify-content-between align-items-center mb-2 mt-4">
                <h5 class="m-0">Cadastro</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('cadastro')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('cadastro')" />
                </div>
            </div>
            <div class="grid">
                <div class="col-12 md:col-4" v-for="option of multiselectValues?.cadastro" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>
            <div class="flex justify-content-between align-items-center mb-2 mt-4">
                <h5 class="m-0">Permissões</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('permissoes')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('permissoes')" />
                </div>
            </div>
            <div class="grid">
                <div class="col-12 md:col-4" v-for="option of multiselectValues?.permissoes" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>
            <div class="flex justify-content-between align-items-center mb-2 mt-4">
                <h5 class="m-0">Categorias</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('categorias')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('categorias')" />
                </div>
            </div>
            <div class="grid">
                <div class="col-12 md:col-4" v-for="option of multiselectValues?.categorias" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>
            <div class="flex justify-content-between align-items-center mb-2 mt-4">
                <h5 class="m-0">Centro de Custo</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('centrodecusto')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('centrodecusto')" />
                </div>
            </div>
            <div class="grid">
                <div class="col-12 md:col-4" v-for="option of multiselectValues?.centrodecusto" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>
            <div class="flex justify-content-between align-items-center mb-2 mt-4">
                <h5 class="m-0">Bancos</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('bancos')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('bancos')" />
                </div>
            </div>
            <div class="grid">
                <div class="col-12 md:col-4" v-for="option of multiselectValues?.bancos" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4">
                <h5 class="m-0">Clientes</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('clientes')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('clientes')" />
                </div>
            </div>
            <div class="grid">
                <div class="col-12 md:col-4" v-for="option of multiselectValues?.clientes" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.cotacoes_solicitacao">
                <h5 class="m-0">Cotações - Solicitação</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('cotacoes_solicitacao')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('cotacoes_solicitacao')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.cotacoes_solicitacao">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.cotacoes_solicitacao)" :key="`solicitacao-${option.slug}`">
                    <div class="field-checkbox mb-0">
                        <Checkbox :id="`solicitacao-${option.slug}`" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label :for="`solicitacao-${option.slug}`">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.cotacoes_edicao">
                <h5 class="m-0">Cotações - Edição</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('cotacoes_edicao')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('cotacoes_edicao')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.cotacoes_edicao">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.cotacoes_edicao)" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.cotacoes_comprador">
                <h5 class="m-0">Cotações - Comprador</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('cotacoes_comprador')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('cotacoes_comprador')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.cotacoes_comprador">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.cotacoes_comprador)" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.cotacoes_autorizacao">
                <h5 class="m-0">Cotações - Autorização</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('cotacoes_autorizacao')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('cotacoes_autorizacao')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.cotacoes_autorizacao">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.cotacoes_autorizacao)" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.cotacoes_analise">
                <h5 class="m-0">Cotações - Análise</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('cotacoes_analise')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('cotacoes_analise')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.cotacoes_analise">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.cotacoes_analise)" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.cotacoes_gerencia">
                <h5 class="m-0">Cotações - Gerência</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('cotacoes_gerencia')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('cotacoes_gerencia')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.cotacoes_gerencia">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.cotacoes_gerencia)" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.cotacoes_reprovar">
                <h5 class="m-0">Cotações - Reprovar</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('cotacoes_reprovar')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('cotacoes_reprovar')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.cotacoes_reprovar">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.cotacoes_reprovar)" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.cotacoes_impressao">
                <h5 class="m-0">Cotações - Impressão</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('cotacoes_impressao')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('cotacoes_impressao')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.cotacoes_impressao">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.cotacoes_impressao)" :key="`impressao-${option.slug}`">
                    <div class="field-checkbox mb-0">
                        <Checkbox :id="`impressao-${option.slug}`" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label :for="`impressao-${option.slug}`">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.cotacoes_admin">
                <h5 class="m-0">Cotações - Admin</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('cotacoes_admin')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('cotacoes_admin')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.cotacoes_admin">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.cotacoes_admin)" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.cotacoes_selecao">
                <h5 class="m-0">Cotações - Seleção</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('cotacoes_selecao')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('cotacoes_selecao')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.cotacoes_selecao">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.cotacoes_selecao)" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.cotacoes_aprovacao_nivel">
                <h5 class="m-0">Cotações - Aprovação por Nível</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('cotacoes_aprovacao_nivel')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('cotacoes_aprovacao_nivel')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.cotacoes_aprovacao_nivel">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.cotacoes_aprovacao_nivel)" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4">
                <h5 class="m-0">Usuário</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('usuario')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('usuario')" />
                </div>
            </div>
            <div class="grid">
                <div class="col-12 md:col-4" v-for="option of multiselectValues?.usuario" :key="option.id">
                    <div class="field-checkbox mb-0">
                        <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label for="checkOption1">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.estoque">
                <h5 class="m-0">Estoque</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('estoque')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('estoque')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.estoque">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.estoque)" :key="`estoque-${option.slug}`">
                    <div class="field-checkbox mb-0">
                        <Checkbox :id="`estoque-${option.slug}`" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label :for="`estoque-${option.slug}`">{{ option.name }}</label>
                    </div>
                </div>
            </div>

            <div class="flex justify-content-between align-items-center mb-2 mt-4" v-if="multiselectValues?.ativos">
                <h5 class="m-0">Ativos</h5>
                <div>
                    <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('ativos')" />
                    <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('ativos')" />
                </div>
            </div>
            <div class="grid" v-if="multiselectValues?.ativos">
                <div class="col-12 md:col-4" v-for="option of getUniqueItemsBySlug(multiselectValues?.ativos)" :key="`ativos-${option.slug}`">
                    <div class="field-checkbox mb-0">
                        <Checkbox :id="`ativos-${option.slug}`" name="option" :value="option.slug" v-model="checkboxValue" />
                        <label :for="`ativos-${option.slug}`">{{ option.name }}</label>
                    </div>
                </div>
            </div>
            <div v-if="permissionsService.hasPermissions('view_mastergeral')">
                <div class="flex justify-content-between align-items-center mb-2 mt-4">
                    <h5 class="m-0">Gestão de Empresas</h5>
                    <div>
                        <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('companies')" />
                        <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('companies')" />
                    </div>
                </div>
                <div class="grid">
                    <div class="col-12 md:col-4" v-for="option of multiselectValues?.companies" :key="option.id">
                        <div class="field-checkbox mb-0">
                            <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                            <label for="checkOption1">{{ option.name }}</label>
                        </div>
                    </div>
                </div>

                <div class="flex justify-content-between align-items-center mb-2 mt-4">
                    <h5 class="m-0">Permissões Master</h5>
                    <div>
                        <Button label="Selecionar Todos" icon="pi pi-check" class="p-button-sm p-button-text p-button-success mr-2" @click="selecionarTodos('geral')" />
                        <Button label="Desselecionar" icon="pi pi-times" class="p-button-sm p-button-text p-button-danger" @click="desselecionarTodos('geral')" />
                    </div>
                </div>
                <div class="grid">
                    <div class="col-12 md:col-4" v-for="option of multiselectValues?.geral" :key="option.id">
                        <div class="field-checkbox mb-0">
                            <Checkbox id="checkOption1" name="option" :value="option.slug" v-model="checkboxValue" />
                            <label for="checkOption1">{{ option.name }}</label>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </Card>

    <Message v-if="errors?.cities" severity="error" :closable="false">{{ errors.cities[0] }}</Message>
    <!-- <City 
		:cicom="cicom" 
		:oldCicom="oldCicom"
		:loading="loading" 
		@updateCicom="clearCicom" 
		@addCityBeforeSave="addCityBeforeSave" 
		@changeLoading="changeLoading" 
		v-if="cicom?.enabled"
	/> -->
</template>
