<script setup>
import { ref, onBeforeMount, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { useLayout } from '@/layout/composables/layout';

import PermissionsService from '@/service/PermissionsService';

const permissionService = new PermissionsService();
const store = useStore();

const route = useRoute();

const { layoutConfig, layoutState, setActiveMenuItem, onMenuToggle } = useLayout();

const props = defineProps({
    item: {
        type: Object,
        default: () => ({})
    },
    permissions: [],
    index: {
        type: Number,
        default: 0
    },
    root: {
        type: Boolean,
        default: true
    },
    parentItemKey: {
        type: String,
        default: null
    }
});

const isActiveMenu = ref(false);
const itemKey = ref(null);

onBeforeMount(() => {
    itemKey.value = props.parentItemKey ? props.parentItemKey + '-' + props.index : String(props.index);

    const activeItem = layoutState.activeMenuItem;

    isActiveMenu.value = activeItem === itemKey.value || activeItem ? activeItem.startsWith(itemKey.value + '-') : false;

});

watch(
    () => layoutConfig.activeMenuItem.value,
    (newVal) => {
        isActiveMenu.value = newVal === itemKey.value || newVal.startsWith(itemKey.value + '-');
    }
);
const itemClick = (event, item) => {
    if (item.disabled) {
        event.preventDefault();
        return;
    }

    const { overlayMenuActive, staticMenuMobileActive } = layoutState;

    if ((item.to || item.url) && (staticMenuMobileActive.value || overlayMenuActive.value)) {
        onMenuToggle();
    }

    if (item.command) {
        item.command({ originalEvent: event, item: item });
    }

    const foundItemKey = item.items ? (isActiveMenu.value ? props.parentItemKey : itemKey) : itemKey.value;

    setActiveMenuItem(foundItemKey);
};

const checkActiveRoute = (item) => {
    return route.path === item.to;
};

// Verificar se o usuário é apenas comprador
const isOnlyBuyer = computed(() => {
    const usuario = store.state.usuario;
    if (!usuario || !usuario.permissions || !Array.isArray(usuario.permissions)) {
        return false;
    }
    
    // Verificar se o usuário tem apenas o grupo/perfil de Comprador
    let hasComprador = false;
    let hasOtherLevels = false;
    
    for (const perm of usuario.permissions) {
        if (perm && perm.name) {
            const groupName = perm.name.toLowerCase();
            // Verificar se é comprador
            if (groupName.includes('comprador') || groupName.includes('buyer')) {
                hasComprador = true;
            }
            // Verificar se tem outros níveis de aprovação
            if (groupName.includes('gerente') || 
                groupName.includes('engenheiro') || 
                groupName.includes('diretor') || 
                groupName.includes('presidente')) {
                hasOtherLevels = true;
            }
        }
    }
    
    // É apenas comprador se tem comprador mas não tem outros níveis
    return hasComprador && !hasOtherLevels;
});

/**
 * Verifica se um item de menu ou qualquer um de seus subitens tem permissão
 * Retorna true se o item ou pelo menos um subitem tiver permissão
 */
const hasAnyPermission = (item) => {
    // Se o item deve ser ocultado para compradores e o usuário é apenas comprador, ocultar
    if (item.hideForBuyers && isOnlyBuyer.value) {
        return false;
    }
    
    // Se o item tem subitens, verificar se pelo menos um subitem tem permissão
    if (item.items && Array.isArray(item.items) && item.items.length > 0) {
        // Verificar recursivamente se pelo menos um subitem tem permissão
        const hasVisibleChild = item.items.some(child => hasAnyPermission(child));
        
        // Se nenhum subitem tem permissão, o item pai não deve aparecer
        if (!hasVisibleChild) {
            return false;
        }
        
        // Se pelo menos um subitem tem permissão, o item pai deve aparecer
        // Não verificar a permissão do item pai se ele tem subitens,
        // pois a visibilidade depende dos subitens
        return true;
    }
    
    // Se não tem subitens, verificar a permissão do próprio item
    // Se não tiver permissão definida, considerar como visível (para compatibilidade)
    if (!item.permission) {
        return true;
    }
    
    return permissionService.hasPermissions(item.permission);
};
</script>

<template>
    <li v-if="item.visible !== false && hasAnyPermission(item)" :class="{ 'layout-root-menuitem': root, 'active-menuitem': isActiveMenu }">
        <div v-if="root && permissionService.hasPermissions(item.permission)" class="layout-menuitem-root-text">{{ item.label }}</div>
        <a v-if="(!item.to || item.items) && (!item.permission || permissionService.hasPermissions(item.permission))" :href="item.url" @click="itemClick($event, item, index)" :class="item.class" :target="item.target" tabindex="0">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label  }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </a>
        <router-link v-if="item.to && !item.items && (!item.permission || permissionService.hasPermissions(item.permission))" @click="itemClick($event, item, index)" :class="[item.class, { 'active-route': checkActiveRoute(item) }]" tabindex="0" :to="item.to">
            <i :class="item.icon" class="layout-menuitem-icon"></i>
            <span class="layout-menuitem-text">{{ item.label }}</span>
            <i class="pi pi-fw pi-angle-down layout-submenu-toggler" v-if="item.items"></i>
        </router-link>
        <Transition v-if="item.items && (!item.permission || permissionService.hasPermissions(item.permission))" name="layout-submenu">
            <ul v-show="root ? true : isActiveMenu" class="layout-submenu">
                <app-menu-item v-for="(child, i) in item.items" :key="child" :index="i" :item="child" :parentItemKey="itemKey" :root="false"></app-menu-item>
            </ul>
        </Transition>
    </li>
</template>

<style lang="scss" scoped></style>
