<script>
    import { useRoute, useRouter } from 'vue-router';
    
    import UsuarioService from '@/service/UsuarioService';
    import EmpresaService from '@/service/EmpresaService';
    import UtilService from '@/service/UtilService';
    import AddressClient from '../address/Address.vue';
    import PermissionsService from '@/service/PermissionsService';
    import { ToastSeverity, PrimeIcons } from 'primevue/api';
    
    import LoadingComponent from '../../components/Loading.vue';
    import { useToast } from 'primevue/usetoast';
    
    export default {
        name: 'cicomForm',
    
        setup() {
            return {
                route: useRoute(),
                router: useRouter(),
                usuarioService: new UsuarioService(),
                empresaService: new EmpresaService(),
                permissionsService: new PermissionsService(),
                icons: PrimeIcons,
                toast: useToast()
            };
        },
    
        components: {
            AddressClient,
            LoadingComponent
        },
    
        data() {
            return {
                usuario: {},              // <- sem ref (Options API já é reativo)
                permissions: [],          // <- sem ref
                empresas: [],             // <- sem ref
                multiselectValue: null,
                oldClient: null,
                errors: {},
                address: {
                    id: 1,
                    name: 'ok',
                    geolocalizacao: '17.23213, 12.455345'
                },
                loading: false,
    
                selectedTipoSexo: null,
                selectedPermissao: null,
    
                sexo: [
                    { name: 'Masculino', value: 'M' },
                    { name: 'Feminino', value: 'F' }
                ],
    
                signatureFile: null,
                signaturePreview: null
            };
        },
    
        computed: {
            title() {
                return this.route.params?.id ? 'Editar Usuário' : 'Criar Usuário';
            }
        },
    
        mounted() {
            this.getPermissions();
            this.getEmpresas();
            this.getUsuario();
        },
    
        methods: {
            setLoading(value) {
                this.loading = !!value;
            },
    
            getPermissions() {
                this.setLoading(true);

                this.permissionsService
                    .getAll()
                    .then((response) => {
                        const data = response?.data?.data || [];
                        this.permissions = data.map((group) => ({
                            name: group.name,
                            id: group.id
                        }));
                        // Após carregar permissões, tentar selecionar a permissão do usuário se já estiver carregado
                        this.setSelectedPermissao();
                    })
                    .catch((error) => {
                        this.toast.add({
                            severity: ToastSeverity.ERROR,
                            detail: error?.message || 'Erro ao carregar permissões',
                            life: 3000
                        });
                    })
                    .finally(() => {
                        this.setLoading(false);
                    });
            },

            setSelectedPermissao() {
                // Só tenta selecionar se tiver usuário carregado
                if (!this.usuario || !this.usuario.id) {
                    return;
                }

                // Se não tiver permissões carregadas ainda, não tenta selecionar
                if (this.permissions.length === 0) {
                    return;
                }

                const companyId = this.$store?.getters?.isCompany?.id;
                
                // Converter permissao para array se necessário
                let permissaoList = [];
                if (Array.isArray(this.usuario?.permissao)) {
                    permissaoList = this.usuario.permissao;
                } else if (this.usuario?.permissao && typeof this.usuario.permissao === 'object') {
                    // Se for um objeto único, converter para array
                    permissaoList = [this.usuario.permissao];
                }

                // Se não tiver permissões, limpar seleção
                if (permissaoList.length === 0) {
                    this.selectedPermissao = null;
                    return;
                }

                // Filtrar por company_id se fornecido (comparar como números)
                let filteredData = permissaoList;
                if (companyId) {
                    filteredData = permissaoList.filter((item) => {
                        const itemCompanyId = item.company_id ? Number(item.company_id) : null;
                        const currentCompanyId = Number(companyId);
                        return itemCompanyId === currentCompanyId;
                    });
                    
                    // Se não encontrou nenhuma permissão para a empresa atual, usar a primeira disponível
                    if (filteredData.length === 0 && permissaoList.length > 0) {
                        filteredData = [permissaoList[0]];
                    }
                }

                // Encontrar a permissão correspondente em this.permissions pelo ID
                // Isso garante que usamos a mesma referência do objeto que está no array permissions
                if (filteredData.length > 0) {
                    const permissaoId = Number(filteredData[0].id);
                    const permissaoName = filteredData[0].name || 'Permissão';
                    let foundPermission = this.permissions.find(p => Number(p.id) === permissaoId);
                    
                    // Se não encontrou na lista, adicionar à lista para que apareça no dropdown
                    if (!foundPermission) {
                        const newPermission = {
                            id: permissaoId,
                            name: permissaoName
                        };
                        this.permissions.push(newPermission);
                        foundPermission = newPermission;
                        
                        // Debug em desenvolvimento
                        if (process.env.NODE_ENV === 'development') {
                            console.warn('Permissão do usuário adicionada à lista:', {
                                permissaoId,
                                permissaoName,
                                permissionsCount: this.permissions.length
                            });
                        }
                    }
                    
                    // Usar a referência exata do objeto (agora garantidamente na lista)
                    this.selectedPermissao = foundPermission;
                } else {
                    this.selectedPermissao = null;
                }
            },
    
            getEmpresas() {
                this.setLoading(true);
    
                this.empresaService
                    .getAll()
                    .then((response) => {
                        this.empresas = response?.data?.data || [];
                    })
                    .catch((error) => {
                        this.toast.add({
                            severity: ToastSeverity.ERROR,
                            detail:
                                UtilService.message(error?.response?.data || error) ||
                                error?.message ||
                                'Erro ao carregar empresas',
                            life: 3000
                        });
                    })
                    .finally(() => {
                        this.setLoading(false);
                    });
            },
    
            getUsuario() {
                if (this.route.params?.id) {
                    this.usuario = null;
                    this.setLoading(true);
    
                    this.usuarioService
                        .get(this.route.params.id)
                        .then((response) => {
                            this.usuario = response?.data?.data || {};
                            this.multiselectValue = this.usuario.empresas || [];
    
                            this.selectedTipoSexo =
                                this.usuario?.sexo === 'M'
                                    ? { name: 'Masculino', value: 'M' }
                                    : this.usuario?.sexo === 'F'
                                    ? { name: 'Feminino', value: 'F' }
                                    : null;
    
                            // Usar o método auxiliar para definir a permissão selecionada
                            // Isso garante que funciona mesmo se as permissões ainda não foram carregadas
                            this.setSelectedPermissao();
    
                            // A URL da assinatura já vem do backend via UsuarioResource
                            // Se não vier, recalcular usando getSignatureUrl
                            if (this.usuario?.signature_path && !this.usuario?.signature_url) {
                                this.usuario.signature_url = this.usuarioService.getSignatureUrl(
                                    this.usuario.signature_path
                                );
                            }
                        })
                        .catch((error) => {
                            this.toast.add({
                                severity: ToastSeverity.ERROR,
                                detail:
                                    UtilService.message(error?.response?.data || error) ||
                                    error?.message ||
                                    'Erro ao carregar usuário',
                                life: 3000
                            });
                        })
                        .finally(() => {
                            this.setLoading(false);
                        });
                } else {
                    this.usuario = { address: [] };
                    this.multiselectValue = [];
                    this.selectedTipoSexo = null;
                    this.selectedPermissao = null;
                }
            },
    
            onSignatureSelect(event) {
                const file = event?.files?.[0];
                if (!file) return;
    
                // Validar se é PNG
                if (file.type !== 'image/png') {
                    this.toast.add({
                        severity: ToastSeverity.ERROR,
                        detail: 'Apenas arquivos PNG são permitidos',
                        life: 3000
                    });
                    return;
                }
    
                // Validar tamanho (2MB)
                if (file.size > 2048000) {
                    this.toast.add({
                        severity: ToastSeverity.ERROR,
                        detail: 'O arquivo deve ter no máximo 2MB',
                        life: 3000
                    });
                    return;
                }
    
                this.signatureFile = file;
    
                // Criar preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    this.signaturePreview = e.target?.result || null;
                };
                reader.readAsDataURL(file);
            },
    
            removerAssinatura() {
                this.signatureFile = null;
                this.signaturePreview = null;
    
                if (this.usuario && this.usuario.signature_path) {
                    this.usuario.signature_path = null;
                    this.usuario.signature_url = null;
                }
            },
    
            back() {
                this.router.push('/usuarios');
            },
    
            changeEnabled(enabled) {
                if (!this.usuario) this.usuario = {};
                this.usuario.enabled = enabled;
            },
    
            save() {
                this.setLoading(true);
                this.errors = {};
    
                // valida sexo
                if (!this.selectedTipoSexo || !this.selectedTipoSexo.value) {
                    this.toast.add({
                        severity: ToastSeverity.ERROR,
                        detail: 'Selecione o Sexo',
                        life: 3000
                    });
                    this.setLoading(false);
                    return;
                }
    
                // valida permissão
                if (!this.selectedPermissao || !this.selectedPermissao.id) {
                    this.toast.add({
                        severity: ToastSeverity.ERROR,
                        detail: 'Selecione uma permissão',
                        life: 3000
                    });
                    this.setLoading(false);
                    return;
                }
    
                if (!this.usuario) this.usuario = {};
    
                this.usuario.sexo = this.selectedTipoSexo.value;
                this.usuario.permissao = this.selectedPermissao;
                this.usuario.empresas = this.multiselectValue;
    
                // Criar FormData apenas se houver arquivo de assinatura ou se estiver removendo assinatura
                let formData = null;
                const removingSignature = !!(this.usuario.id && this.usuario.signature_path === null);
                if (this.signatureFile || removingSignature) {
                    formData = new FormData();
    
                    // Campos obrigatórios
                    formData.append('nome_completo', this.usuario.nome_completo || '');
                    formData.append('cpf', this.usuario.cpf || '');
                    formData.append('rg', this.usuario.rg || '');
                    formData.append('data_nascimento', this.usuario.data_nascimento || '');
                    formData.append('sexo', this.usuario.sexo || '');
                    formData.append('telefone_celular', this.usuario.telefone_celular || '');
                    formData.append('email', this.usuario.email || '');
    
                    // Campos opcionais
                    if (this.usuario.id) formData.append('id', this.usuario.id);
                    if (this.usuario.login) formData.append('login', this.usuario.login);
                    if (this.usuario.status) formData.append('status', this.usuario.status);
    
                    if (this.usuario.status_motivo !== undefined) {
                        formData.append('status_motivo', this.usuario.status_motivo || '');
                    }
    
                    if (this.usuario.tentativas !== undefined && this.usuario.tentativas !== null) {
                        formData.append('tentativas', String(this.usuario.tentativas));
                    }
    
                    if (this.usuario.password) formData.append('password', this.usuario.password);
    
                    // empresas e permissão como JSON
                    try {
                        if (Array.isArray(this.usuario.empresas)) {
                            formData.append('empresas', JSON.stringify(this.usuario.empresas));
                        }
                    } catch (e) {
                        console.error('Erro ao serializar empresas:', e);
                    }
    
                    try {
                        if (this.usuario.permissao && this.usuario.permissao.id) {
                            formData.append('permissao', JSON.stringify(this.usuario.permissao));
                        }
                    } catch (e) {
                        console.error('Erro ao serializar permissão:', e);
                    }
    
                    // assinatura
                    if (this.signatureFile) {
                        formData.append('signature', this.signatureFile);
                    } else if (removingSignature) {
                        formData.append('signature_path', '');
                    }
                }
    
                this.usuarioService
                    .save(this.usuario, formData)
                    .then((response) => {
                        const saved = response?.data?.data;
    
                        this.toast.add({
                            severity: ToastSeverity.SUCCESS,
                            detail: saved?.id ? 'Dados alterados com sucesso!' : 'Dados inseridos com sucesso!',
                            life: 3000
                        });
    
                        setTimeout(() => {
                            this.router.push({ name: 'usuarioList' });
                        }, 1200);
                    })
                    .catch((error) => {
                        console.log(error);
                        // Erros de validação
                        if (error?.response?.status === 422) {
                            this.errors = error?.response?.data?.errors || {};
                            return;
                        }
    
                        // Outros erros
                        let errorMessage = 'Erro ao salvar usuário.';
                        try {
                            if (error?.response?.data) {
                                const errorData = error.response.data;
                                errorMessage =
                                    (typeof errorData === 'object' ? UtilService.message(errorData) : String(errorData)) ||
                                    errorMessage;
                            } else if (error?.message) {
                                errorMessage = error.message;
                            }
                        } catch (e) {
                            // mantém mensagem padrão
                        }
    
                        this.toast.add({
                            severity: ToastSeverity.ERROR,
                            detail: errorMessage || 'Erro ao salvar usuário.',
                            life: 3000
                        });
                    })
                    .finally(() => {
                        this.setLoading(false);
                    });
            },
    
            clearclient() {
                this.loading = true;
            },
    
            addCityBeforeSave(city) {
                this.setLoading(true);
            },
    
            clearCicom() {
                this.loading = true;
            }
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
                <div class="col-12">
                    <div class="p-fluid formgrid grid">
                        <div v-if="permissionsService.isMaster()" class="field col-12 md:col-12">
                            <label for="firstname2">Empresas</label>
                            <MultiSelect v-model="multiselectValue" :options="empresas" optionLabel="company" placeholder="Selecione as Empresas" :filter="true">
                                <template #value="slotProps">
                                    <div class="inline-flex align-items-center py-1 px-2 bg-primary text-primary border-round mr-2" v-for="option of slotProps.value" :key="option.company">
                                        <div>{{ option.company }}</div>
                                    </div>
                                    <template v-if="!slotProps.value || slotProps.value.length === 0">
                                        <div class="p-1">Selecione as Empresas</div>
                                    </template>
                                </template>
                                <template #option="slotProps">
                                    <div class="flex align-items-center">
                                        <div>{{ slotProps.option.company }}</div>
                                    </div>
                                </template>
                            </MultiSelect>
                        </div>
    
                        <div v-if="!route.params?.id" class="field col-12 md:col-3">
                            <label for="firstname2">Login</label>
                            <InputText id="firstname2" v-model="usuario.login" type="text" />
                        </div>
    
                        <div class="field col-12 md:col-3">
                            <label for="firstname2">Nome Completo</label>
                            <InputText id="firstname2" v-model="usuario.nome_completo" type="text" />
                        </div>
    
                        <div class="field col-12 md:col-3">
                            <label for="firstname2">E-mail</label>
                            <InputText id="firstname2" v-model="usuario.email" type="text" />
                        </div>
    
                        <div class="field col-12 md:col-3">
                            <label for="lastname2">Sexo</label>
                            <Dropdown v-model="selectedTipoSexo" :options="sexo" optionLabel="name" placeholder="Selecione" />
                        </div>
    
                        <div class="field col-12 md:col-3">
                            <label for="lastname2">Permissão</label>
                            <Dropdown v-model="selectedPermissao" :options="permissions" optionLabel="name" placeholder="Selecione" />
                        </div>
    
                        <div class="field col-12 md:col-3">
                            <label for="lastname2">Dt. Nascimento</label>
                            <InputMask id="inputmask" v-model="usuario.data_nascimento" mask="99/99/9999"></InputMask>
                        </div>
    
                        <div class="field col-12 md:col-3">
                            <label for="state">Telefone</label>
                            <InputMask id="inputmask" v-model="usuario.telefone_celular" mask="(99) 9999-9999"></InputMask>
                        </div>
    
                        <div class="field col-12 md:col-3">
                            <label for="state">CPF</label>
                            <InputMask id="inputmask" v-model="usuario.cpf" mask="999.999.999-99"></InputMask>
                        </div>
    
                        <div class="field col-12 md:col-3">
                            <label for="zip">RG</label>
                            <InputMask id="inputmask" v-model="usuario.rg" mask="9.999.999"></InputMask>
                        </div>
    
                        <div class="field col-12 md:col-6">
                            <label for="firstname2">Senha</label>
                            <InputText id="firstname2" v-model="usuario.password" type="password" />
                        </div>
    
                        <div class="field col-12 md:col-6">
                            <label for="signature">Assinatura (PNG)</label>
                            <FileUpload
                                mode="basic"
                                name="signature"
                                accept="image/png"
                                :maxFileSize="2048000"
                                :auto="false"
                                :customUpload="true"
                                @select="onSignatureSelect"
                                chooseLabel="Selecionar Assinatura PNG"
                                class="w-full"
                            />
                            <small class="text-500">Formato: PNG | Tamanho máximo: 2MB</small>
    
                            <div v-if="usuario?.signature_path || signaturePreview" class="mt-2">
                                <div class="flex align-items-center gap-2">
                                    <img
                                        v-if="signaturePreview || usuario?.signature_url"
                                        :src="signaturePreview || usuario?.signature_url"
                                        alt="Assinatura"
                                        class="border-round"
                                        style="max-width: 200px; max-height: 100px; border: 1px solid #ddd;"
                                    />
                                    <Button
                                        v-if="usuario?.signature_path || signatureFile"
                                        icon="pi pi-times"
                                        class="p-button-rounded p-button-text p-button-danger p-button-sm"
                                        @click="removerAssinatura"
                                        v-tooltip.top="'Remover assinatura'"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>
    </template>
    