const estoqueRoutes = [
    {
        path: '/estoque',
        redirect: '/estoque/produtos',
        children: [
            // Produtos
            {
                path: 'produtos',
                name: 'estoqueProdutosList',
                component: () => import('@/views/estoque/ProdutosList.vue')
            },
            {
                path: 'produtos/add',
                name: 'estoqueProdutosAdd',
                component: () => import('@/views/estoque/ProdutosForm.vue')
            },
            {
                path: 'produtos/:id',
                name: 'estoqueProdutosEdit',
                component: () => import('@/views/estoque/ProdutosForm.vue')
            },
            // Locais
            {
                path: 'locais',
                name: 'estoqueLocaisList',
                component: () => import('@/views/estoque/LocaisList.vue')
            },
            {
                path: 'locais/add',
                name: 'estoqueLocaisAdd',
                component: () => import('@/views/estoque/LocaisForm.vue')
            },
            {
                path: 'locais/:id',
                name: 'estoqueLocaisEdit',
                component: () => import('@/views/estoque/LocaisForm.vue')
            },
            // Consulta
            {
                path: 'consulta',
                name: 'estoqueConsulta',
                component: () => import('@/views/estoque/EstoqueConsulta.vue')
            },
            // Movimentações
            {
                path: 'movimentacoes',
                name: 'estoqueMovimentacoes',
                component: () => import('@/views/estoque/MovimentacoesList.vue')
            },
            // Almoxarifes
            {
                path: 'almoxarifes',
                name: 'estoqueAlmoxarifes',
                component: () => import('@/views/estoque/AlmoxarifesGerenciar.vue')
            },
            // Reservas Pendentes
            {
                path: 'reservas',
                name: 'estoqueReservas',
                component: () => import('@/views/estoque/ReservasPendentes.vue')
            },
            // Nota Fiscal
            {
                path: 'nota-fiscal/nova',
                name: 'notaFiscalNova',
                component: () => import('@/views/estoque/NotaFiscalForm.vue')
            },
            // Dashboard
            {
                path: 'dashboard',
                name: 'estoqueDashboard',
                component: () => import('@/views/estoque/DashboardEstoque.vue')
            }
        ]
    }
];

export default estoqueRoutes;

