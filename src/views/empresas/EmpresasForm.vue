<script>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import EmpresasService from '@/service/EmpresasService';
import UsuarioService from '@/service/UsuarioService';
import PlanosService from '@/service/PlanosService';
import UtilService from '@/service/UtilService';
import Usuarios from './components/Usuarios.vue';
import { ToastSeverity, PrimeIcons } from 'primevue/api';

import LoadingComponent from '../../components/Loading.vue';
import { useToast } from 'primevue/usetoast';

export default {
    name: 'cicomForm',
    setup() {
        return {
            route: useRoute(),
            router: useRouter(),
            empresasService: new EmpresasService(),
            usuarioService: new UsuarioService(),
            planosService: new PlanosService(),
            icons: PrimeIcons,
            toast: useToast()
        };
    },
    components: {
        Usuarios
    },
    data() {
        return {
            empresas: ref({}),
            usuarios: ref([]),
            planos: ref([]),
            oldempresas: ref(null),
            errors: ref([]),
            address: ref({
                id: 1,
                name: 'ok',
                geolocalizacao: '17.23213, 12.455345'
            }),
            loading: ref(false),
            selectedAtivo: ref(''),
            selectedPlano: ref(''),
            ativo: ref([
                { name: 'Ativada', value: 1 },
                { name: 'Inativo', value: 0 }
            ]),
            regimesTributarios: ref([
                { label: 'NORMAL', value: 'NORMAL' },
                { label: 'SIMPLES NACIONAL', value: 'SIMPLES_NACIONAL' },
                { label: 'SIMPLES NACIONAL - EXCESSO', value: 'SIMPLES_NACIONAL_EXCESSO' }
            ])
        };
    },
    methods: {
        changeLoading() {
            this.loading = !this.loading;
        },
        getempresas() {
            this.loading = true;
            if (this.route.params?.id) {
                this.empresas = ref(null);
                this.loading = true;
                this.empresasService
                    .get(this.route.params.id)
                    .then((response) => {
                        this.empresas = response.data;

                        if (this.empresas?.ativo == 1) {
                            this.selectedAtivo = { name: 'Ativada', value: 1 };
                        } else {
                            this.selectedAtivo = { name: 'Inativo', value: 0 };
                        }

						if (this.empresas?.plano_id) {
							this.selectedPlano = this.planos.find((plano) => plano.id == this.empresas.plano_id);
						}
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
                    });
            } else {
                this.empresas = ref({});
            }
        },
        getUsuariosDaEmpresa() {
            if (this.route.params?.id) {
                this.usuarios = ref(null);
                this.loading = true;
                this.usuarioService
                    .getAllUsuariosCompany(this.route.params.id)
                    .then((response) => {
                        console.log(response.data);
                        this.usuarios = response.data.data;
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
                    });
            } else {
                this.usuarios = ref({});
            }
        },
        getPlanos() {
            this.planos = ref(null);
            this.loading = true;
            this.planosService
                .getAll()
                .then((response) => {
                    this.planos = response.data;
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
                });
        },
        back() {
            this.router.push(`/empresas`);
        },
        changeEnabled(enabled) {
            this.empresas.enabled = enabled;
        },
        save() {
            this.changeLoading();
            this.errors = [];

            this.empresas.ativo = this.selectedAtivo.value;

			this.empresas.plano_id = this.selectedPlano.id;

            this.empresasService
                .save(this.empresas)
                .then((response) => {
                    if (undefined != response.data.data) {
                        this.empresas = response.data.data;
                    }

                    this.toast.add({
                        severity: ToastSeverity.SUCCESS,
                        detail: this.empresas?.id ? 'Dados alterados com sucesso!' : 'Dados inseridos com sucesso!',
                        life: 3000
                    });

                    setTimeout(() => {
                        this.router.push({ name: 'empresasList' });
                    }, 1200);
                })
                .catch((error) => {
                    this.changeLoading();
                    this.errors = error?.response?.data?.errors;

                    if (error?.response?.status != 422) {
                        this.toast.add({
                            severity: ToastSeverity.ERROR,
                            detail: UtilService.message(error.response.data),
                            life: 3000
                        });
                    }

                    this.changeLoading();
                })
                .finally(() => {
                    this.changeLoading();
                });
        },

        clearempresas() {
            this.loading = true;
        },
        addCityBeforeSave(city) {
            // this.empresas.cities.push(city);
            this.changeLoading();
        },
        clearCicom() {
            this.loading = true;
        }
    },
    computed: {
        title() {
            return this.route.params?.id ? 'Editar Empresa' : 'Criar Empresa';
        }
    },
    mounted() {
		this.getPlanos();
        this.getempresas();
        this.getUsuariosDaEmpresa();
    }
};
</script>

<template>
    <Toast />
    <LoadingComponent :loading="loading" />
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
            <div class="col-12">
                <div class="p-fluid formgrid grid">
                    <!-- Coluna Esquerda -->
                    <div class="col-12 md:col-6">
                        <h6 class="mb-3">Identificação</h6>
                        <div class="field">
                            <label for="company">Unidade *</label>
                            <InputText id="company" v-model="empresas.company" type="text" />
                        </div>
                        <div class="field">
                            <label for="fantasia">Fantasia</label>
                            <InputText id="fantasia" v-model="empresas.fantasia" type="text" />
                        </div>
                        <div class="field">
                            <label for="razao_social">Razão Social</label>
                            <InputText id="razao_social" v-model="empresas.razao_social" type="text" />
                        </div>
                        
                        <h6 class="mt-4 mb-3">Endereço</h6>
                        <div class="grid">
                            <div class="field col-10">
                                <label for="endereco">Endereço</label>
                                <InputText id="endereco" v-model="empresas.endereco" type="text" />
                            </div>
                            <div class="field col-2">
                                <label for="endereco_numero">N°</label>
                                <InputText id="endereco_numero" v-model="empresas.endereco_numero" type="text" />
                            </div>
                        </div>
                        <div class="field">
                            <label for="bairro">Bairro</label>
                            <InputText id="bairro" v-model="empresas.bairro" type="text" />
                        </div>
                        <div class="grid">
                            <div class="field col-10">
                                <label for="cidade">Cidade</label>
                                <InputText id="cidade" v-model="empresas.cidade" type="text" />
                            </div>
                            <div class="field col-2">
                                <label for="uf">UF</label>
                                <InputText id="uf" v-model="empresas.uf" type="text" maxlength="2" />
                            </div>
                        </div>
                        <div class="field">
                            <label for="fones">Fones *</label>
                            <InputText id="fones" v-model="empresas.numero_contato" type="text" />
                        </div>
                        <div class="field">
                            <label for="cep">CEP *</label>
                            <InputText id="cep" v-model="empresas.cep" type="text" />
                        </div>
                        <div class="field">
                            <label for="inscricao_estadual">Inscrição Estadual</label>
                            <InputText id="inscricao_estadual" v-model="empresas.inscricao_estadual" type="text" />
                        </div>
                        <div class="field">
                            <label for="cnpj">CNPJ *</label>
                            <InputText id="cnpj" v-model="empresas.cnpj" type="text" />
                        </div>
                        <div class="field">
                            <label for="email">E-mail</label>
                            <InputText id="email" v-model="empresas.email" type="email" />
                        </div>
                        <div class="field">
                            <label for="regime_tributario">Regime Tributário</label>
                            <Dropdown 
                                id="regime_tributario" 
                                v-model="empresas.regime_tributario" 
                                :options="regimesTributarios" 
                                optionLabel="label"
                                optionValue="value"
                                placeholder="Selecione" 
                            />
                        </div>
                    </div>

                    <!-- Coluna Direita -->
                    <div class="col-12 md:col-6">
                        <h6 class="mb-3">&nbsp;</h6>
                        <div class="field">
                            <label for="inscricao_estadual_subst_tributario">Insc. Estadual Subst. Tributário</label>
                            <InputText id="inscricao_estadual_subst_tributario" v-model="empresas.inscricao_estadual_subst_tributario" type="text" />
                        </div>
                        <div class="field">
                            <label for="inscricao_municipal">Inscrição Municipal</label>
                            <InputText id="inscricao_municipal" v-model="empresas.inscricao_municipal" type="text" />
                        </div>
                        <div class="field">
                            <label for="credito_simples_nacional">Crédito Simples Nacional (%)</label>
                            <InputNumber 
                                id="credito_simples_nacional" 
                                v-model="empresas.credito_simples_nacional" 
                                :min="0" 
                                :max="100" 
                                :minFractionDigits="2"
                                :maxFractionDigits="2"
                                suffix="%"
                                :showButtons="false"
                                class="w-full"
                            />
                            <small class="text-500">(Alíquota)</small>
                        </div>

                        <h6 class="mt-4 mb-3">Configurações</h6>
                        <div class="field">
                            <label for="plano">Plano</label>
                            <Dropdown v-model="selectedPlano" :options="planos" optionLabel="nome" placeholder="Selecione" />
                        </div>
                        <div v-if="this.empresas?.id" class="field">
                            <label for="ativo">Status da Empresa</label>
                            <Dropdown v-model="selectedAtivo" :options="ativo" optionLabel="name" placeholder="Selecione" />
                        </div>
                        <div v-if="this.empresas?.id" class="field">
                            <label for="motivo_inativo">Motivo Inativo</label>
                            <InputText id="motivo_inativo" v-model="empresas.motivo_inativo" type="text" />
                        </div>
                        <div class="field">
                            <label for="whatsapp">URL Integração WhatsApp</label>
                            <InputText id="whatsapp" v-model="empresas.whatsapp" type="text" />
                        </div>
                    </div>
                </div>
            </div>

            <Usuarios
                v-if="this.empresas?.id"
                :usuarios="this.usuarios"
                :address="this.empresas?.address"
                :oldCicom="this.oldempresas"
                :loading="loading"
                @updateCicom="clearCicom"
                @addCityBeforeSave="addCityBeforeSave"
                @changeLoading="changeLoading"
            />
        </template>
    </Card>
</template>
