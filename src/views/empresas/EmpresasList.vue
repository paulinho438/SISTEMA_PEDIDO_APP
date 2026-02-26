<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { FilterMatchMode, PrimeIcons, ToastSeverity } from 'primevue/api';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import EmpresasService from '@/service/EmpresasService';
import PermissionsService from '@/service/PermissionsService';
import { useToast } from 'primevue/usetoast';

export default {
	name: 'CicomList',
	components: { ConfirmDialog },
	setup() {
		return {
			empresasService: new EmpresasService(),
			permissionsService: new PermissionsService(),
			router: useRouter(),
			icons: PrimeIcons,
			toast: useToast(),
			confirm: useConfirm()
		};
	},
	data() {
		return {
			empresas: ref([]),
			loading: ref(false),
			filters: ref(null),
		};
	},
	methods: {
		dadosSensiveis(dado) {
			return (this.permissionsService.hasPermissions('view_clientes_sensitive') ? dado : '*********')
		},
		getEmpresas() {
			this.loading = true;

			this.empresasService.getAll()
			.then((response) => {
				this.empresas = response.data.data;
			})
			.catch((error) => {
				this.toast.add({
					severity: ToastSeverity.ERROR,
					detail: error.message,
					life: 3000
				});
			})
			.finally(() => {
				this.loading = false;
			});
		},
		editCategory(id) {
			if (undefined === id) this.router.push('/empresas/add');
			else this.router.push(`/empresas/${id}/edit`);
		},
		confirmDelete(empresa) {
			this.confirm.require({
				message: `Deseja realmente excluir a empresa "${empresa.company}"?`,
				header: 'Confirmar Exclusão',
				icon: 'pi pi-exclamation-triangle',
				acceptClass: 'p-button-danger',
				acceptLabel: 'Excluir',
				rejectLabel: 'Cancelar',
				accept: () => {
					this.loading = true;
					this.empresasService.delete(empresa.id)
						.then((response) => {
							this.toast.add({
								severity: ToastSeverity.SUCCESS,
								detail: response?.data?.message ?? 'Empresa excluída com sucesso.',
								life: 3000
							});
							this.getEmpresas();
						})
						.catch((error) => {
							this.toast.add({
								severity: ToastSeverity.ERROR,
								detail: error?.response?.data?.message ?? error?.message ?? 'Erro ao excluir empresa.',
								life: 3000
							});
						})
						.finally(() => {
							this.loading = false;
						});
				}
			});
		},
		initFilters() {
			this.filters = {
				nome_completo: { value: null, matchMode: FilterMatchMode.CONTAINS }
			};
		},
		clearFilter() {
			this.initFilters();
		}
	},
	beforeMount() {
		this.initFilters();
	},
	mounted() {
		this.permissionsService.hasPermissionsView('view_empresas');
		this.getEmpresas();
	}
};
</script>

<template>
	<Toast />
	<ConfirmDialog />
	<div class="grid">
		<div class="col-12">
			<div class="grid flex flex-wrap mb-3 px-4 pt-2">
				<div class="col-8 px-0 py-0">
					<h5 class="px-0 py-0 align-self-center m-2"><i class="pi pi-building"></i> Empresas</h5>
				</div>
				<div class="col-4 px-0 py-0 text-right">
					<Button v-if="permissionsService.hasPermissions('criar_empresas')" label="Nova Empresa" class="p-button-outlined p-button-secondary p-button-sm" icon="pi pi-plus" @click.prevent="editCategory()" />
				</div>
			</div>
			<div class="card">
				<div class="mt-3">
					<DataTable
						dataKey="id"
						:value="empresas"
						:paginator="true"
						:rows="10"
						:loading="loading"
						:filters="filters"
						paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
						:rowsPerPageOptions="[5, 10, 25]"
						currentPageReportTemplate="Mostrando {first} de {last} de {totalRecords} empresa(s)"
						responsiveLayout="scroll"
					>
					<template #header>
						<div class="flex justify-content-between">
							<Button type="button" icon="pi pi-filter-slash" label="Limpar Filtros" class="p-button-outlined p-button-sm" @click="clearFilter()" />
							<span class="p-input-icon-left">
								<i class="pi pi-search" />
								<InputText v-model="filters.nome_completo.value" placeholder="Informe o Nome" class="p-inputtext-sm" />
							</span>
						</div>
					</template>

						<Column field="name" header="Nome da Empresa" :sortable="true" class="w-2">
							<template #body="slotProps">
								<span class="p-column-title">Nome da Empresa</span>
								{{ slotProps.data.company }}
							</template>
						</Column>

					<Column field="created_at" header="Dt. Criação" :sortable="true" class="w-2">
						<template #body="slotProps">
							<span class="p-column-title">Dt. Criação</span>
							{{ slotProps.data.created_at }}
						</template>
					</Column>

					<Column v-if="permissionsService.hasPermissions('edit_empresas') || permissionsService.hasPermissions('delete_empresas')" field="edit" header="Ações" :sortable="false" class="w-1">
						<template #body="slotProps">
							<Button v-if="permissionsService.hasPermissions('edit_empresas') && !slotProps.data.standard" class="p-button p-button-icon-only p-button-text p-button-secondary m-0 p-0 mr-1" type="button" :icon="icons.FILE_EDIT" v-tooltip.top="'Editar'" @click.prevent="editCategory(slotProps.data.id)" />
							<Button v-if="permissionsService.hasPermissions('delete_empresas') && !slotProps.data.standard" class="p-button p-button-icon-only p-button-text p-button-danger m-0 p-0" type="button" icon="pi pi-trash" v-tooltip.top="'Excluir'" @click.prevent="confirmDelete(slotProps.data)" />
						</template>
					</Column>
					</DataTable>
				</div>
			</div>
		</div>
	</div>
</template>
