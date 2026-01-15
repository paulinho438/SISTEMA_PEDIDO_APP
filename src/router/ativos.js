const ativosRoutes = [
    {
        path: '/ativos',
        redirect: '/ativos/controle',
        children: [
            {
                path: 'controle',
                name: 'ativosControle',
                component: () => import('@/views/ativos/AtivosList.vue')
            },
            {
                path: 'add',
                name: 'ativosAdd',
                component: () => import('@/views/ativos/AtivosForm.vue')
            },
            {
                path: ':id',
                name: 'ativosEdit',
                component: () => import('@/views/ativos/AtivosForm.vue')
            },
            {
                path: 'consulta',
                name: 'ativosConsulta',
                component: () => import('@/views/ativos/AtivosDetalhes.vue')
            },
            // Cadastros Auxiliares - Filiais
            {
                path: 'filiais',
                name: 'ativosFiliaisList',
                component: () => import('@/views/ativos/FiliaisList.vue')
            },
            {
                path: 'filiais/add',
                name: 'ativosFiliaisAdd',
                component: () => import('@/views/ativos/FiliaisForm.vue')
            },
            {
                path: 'filiais/:id',
                name: 'ativosFiliaisEdit',
                component: () => import('@/views/ativos/FiliaisForm.vue')
            }
        ]
    }
];

export default ativosRoutes;

