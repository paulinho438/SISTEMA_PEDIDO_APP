<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import AppMenuItem from './AppMenuItem.vue';
import UsuarioService from '@/service/UsuarioService';

const router = useRouter();
const store = useStore();
const usuarioService = new UsuarioService();

const model = ref([
    {
        label: 'HOME',
        permission: 'view_dashboard',
        items: [{label: 'DASHBOARD', icon: 'pi pi-fw pi-home', to: '/', permission: 'view_dashboard'}]
    },
    {
        label: '',
        icon: 'pi pi-fw pi-briefcase',
        to: '/pages',
        items: [
            {
                label: 'CADASTROS',
                icon: 'pi pi-fw pi-database',
                items: [
                    {
                        label: 'Empresas',
                        icon: 'pi pi-fw pi-building',
                        to: '/empresas',
                        permission: 'view_empresas'
                    },
                    {
                        label: 'Permissões',
                        icon: 'pi pi-fw pi-database',
                        to: '/permissoes',
                        permission: 'view_permissions'
                    },
                    {
                        label: 'Usuários',
                        icon: 'pi pi-fw pi-database',
                        to: '/usuarios',
                        permission: 'criar_usuarios'
                    }
                ]
            },
            {
                label: 'ESTOQUE',
                permission: 'view_estoque',
                icon: 'pi pi-fw pi-box',
                items: [
                    { label: 'Dashboard', icon: 'pi pi-fw pi-chart-bar', to: '/estoque/dashboard', permission: 'view_estoque_dashboard' },
                    { label: 'Produtos', icon: 'pi pi-fw pi-box', to: '/estoque/produtos', permission: 'view_estoque_produtos' },
                    { label: 'Locais', icon: 'pi pi-fw pi-map-marker', to: '/estoque/locais', permission: 'view_estoque_locais' },
                    { label: 'Consulta de Estoque', icon: 'pi pi-fw pi-search', to: '/estoque/consulta', permission: 'view_estoque_consulta' },
                    { label: 'Movimentações', icon: 'pi pi-fw pi-arrow-right-arrow-left', to: '/estoque/movimentacoes', permission: 'view_estoque_movimentacoes' },
                    { label: 'Transferência em Lote', icon: 'pi pi-fw pi-send', to: '/estoque/transferencia-lote', permission: 'view_estoque_movimentacoes_create' },
                    { label: 'Controle de Transferências', icon: 'pi pi-fw pi-list', to: '/estoque/transferencias', permission: 'view_estoque_movimentacoes' },
                    { label: 'Gerenciar Almoxarifes', icon: 'pi pi-fw pi-users', to: '/estoque/almoxarifes', permission: 'view_estoque_almoxarifes' },
                    { label: 'Análise de Reservas', icon: 'pi pi-fw pi-check-circle', to: '/estoque/reservas', permission: 'view_estoque_reservas' },
                    { label: 'Nota Fiscal e Entrada', icon: 'pi pi-fw pi-file', to: '/estoque/nota-fiscal/nova', permission: 'view_estoque_nota_fiscal' }
                ]
            },
            {
                label: 'ATIVOS',
                permission: 'view_ativos',
                icon: 'pi pi-fw pi-briefcase',
                items: [
                    { label: 'Controle de Ativos', icon: 'pi pi-fw pi-list', to: '/ativos/controle', permission: 'view_ativos_controle' },
                    {
                        label: 'Cadastros Auxiliares',
                        icon: 'pi pi-fw pi-database',
                        permission: 'view_ativos_filiais',
                        items: [
                            { label: 'Filiais', icon: 'pi pi-fw pi-building', to: '/ativos/filiais', permission: 'view_ativos_filiais' },
                            { label: 'Locais', icon: 'pi pi-fw pi-map-marker', to: '/ativos/locais', permission: 'view_ativos_filiais' },
                            { label: 'Descrições Padrão', icon: 'pi pi-fw pi-tag', to: '/ativos/descricoes-padrao', permission: 'view_ativos_descricoes_padrao' }
                        ]
                    }
                ]
            },
            {
                label: 'PROCESSOS',
                icon: 'pi pi-fw pi-arrow-right-arrow-left',
                items: [
                    { label: 'Solicitações', icon: 'pi pi-fw pi-arrow-right-arrow-left', to: '/solicitacoes', permission: 'create_cotacoes' },
                    { label: 'Solicitações Pendentes', icon: 'pi pi-fw pi-arrow-right-arrow-left', to: '/solicitacoes_pendentes', permission: 'view_solicitacoes_pendentes' },
                    { label: 'Cotações Pendentes', icon: 'pi pi-fw pi-arrow-right-arrow-left', to: '/cotacoes', permission: 'view_cotacoes' },
                    { label: 'Pendentes de Análise', icon: 'pi pi-fw pi-check-square', to: '/cotacoes/pendentes_analise', permission: 'view_pendentes_analise' },
                    { label: 'Pedidos de Compra', icon: 'pi pi-fw pi-shopping-cart', to: '/compras/pedidos', permission: 'view_cotacoes' },
                    {
                        label: 'Relatórios',
                        icon: 'pi pi-fw pi-chart-bar',
                        permission: 'view_cotacoes',
                        items: [
                            { label: 'Acompanhamento de Cotações', icon: 'pi pi-fw pi-table', to: '/cotacoes/acompanhamento', permission: 'view_acompanhamento_cotacoes' },
                            { label: 'Custos por Centro de Custo', icon: 'pi pi-fw pi-chart-bar', to: '/relatorios/custos-centro-custo', permission: 'view_cotacoes' },
                            { label: 'Relatório de cotação', icon: 'pi pi-fw pi-chart-line', to: '/relatorios/cotacoes', permission: 'cotacoes_imprimir' },
                            { label: 'Custos por Fornecedor', icon: 'pi pi-fw pi-chart-line', to: '/relatorios/custos-fornecedor', permission: 'view_cotacoes' },
                            { label: 'Custos por Solicitação', icon: 'pi pi-fw pi-chart-line', to: '/relatorios/custos-solicitacao', permission: 'view_cotacoes' },
                            { label: 'Histórico por Período', icon: 'pi pi-fw pi-calendar-plus', to: '/relatorios/historico-periodo', permission: 'view_cotacoes' }
                        ]
                    }
                ]
            }
        ]
    },
    {
        label: 'GESTÃO DE EMPRESAS',
        permission: 'view_criacao_empresas',
        items: [{label: 'Empresas', icon: 'pi pi-fw pi-building', to: '/empresas', permission: 'view_criacao_empresas'}]
    }
]);

const allCompanies = computed(() => store.getters.allCompanies || []);
const currentCompany = computed(() => store.getters.company || null);
const allPermissions = computed(() => store.getters.allPermissions || []);
const permissions = computed(() => store.getters.permissions || []);

const changeCompany = async (companyId) => {
    try {
        const companyIdNum = Number(companyId);
        const company = allCompanies.value.find(c => Number(c.id) === companyIdNum);
        
        if (!company) {
            console.error('Empresa não encontrada');
            return;
        }

        store.commit('setCompany', company);

        if (allPermissions.value.length > 0) {
            let res = allPermissions.value.filter((item) => Number(item.company_id) === companyIdNum);

            if (res.length > 0 && res[0] && res[0]['permissions'] && Array.isArray(res[0]['permissions'])) {
                // As permissões já vêm como array de strings (slugs)
                store.commit('setPermissions', res[0]['permissions']);
            } else {
                store.commit('setPermissions', []);
            }
        } else {
            store.commit('setPermissions', []);
        }

        // Recarregar a página atual para aplicar as novas permissões
        router.go(0);
    } catch (error) {
        console.error('Erro ao trocar empresa:', error);
    }
};

onMounted(() => {
    // Garantir que as permissões estão carregadas
    if (permissions.value.length === 0 && allPermissions.value.length > 0 && currentCompany.value) {
        const companyId = Number(currentCompany.value.id);
        let res = allPermissions.value.filter((item) => Number(item.company_id) === companyId);

        if (res.length > 0 && res[0] && res[0]['permissions'] && Array.isArray(res[0]['permissions'])) {
            // As permissões já vêm como array de strings (slugs)
            store.commit('setPermissions', res[0]['permissions']);
        }
    }
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item.label || i">
            <app-menu-item :item="item" :index="i" :root="true" :parentItemKey="item.label"></app-menu-item>
        </template>
    </ul>
</template>

<style lang="scss" scoped></style>
