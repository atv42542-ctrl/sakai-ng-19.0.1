// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { TableModule } from 'primeng/table';
// import { ButtonModule } from 'primeng/button';
// import { ToastModule } from 'primeng/toast';
// import { DropdownModule } from 'primeng/dropdown';
// import { CalendarModule } from 'primeng/calendar';
// import { PaginatorModule } from 'primeng/paginator';
// import { DialogModule } from 'primeng/dialog';
// import { InputTextModule } from 'primeng/inputtext';
// import { MenuModule } from 'primeng/menu';
// import { MenuItem, MessageService, TreeNode } from 'primeng/api';
// import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
// import { faTrash, faPlus, faChartBar, faTimes } from '@fortawesome/free-solid-svg-icons';
// import { RouterModule } from '@angular/router';
// import { Subject, takeUntil } from 'rxjs';
// import { DepartmentSelectorComponent } from '../../../../shared/components/department-selector/department-selector.component';
// import { HttpClient } from '@angular/common/http';

// interface Asset {
//     id: number;
//     assetName: string;
//     serial: string;
//     department: string;
//     assetCategory: string;
//     status: 'Active' | 'Inactive' | 'UnderMaintenance';
//     assetQuantity: number;
//     creationDate: Date | null;
// }

// interface DropdownOption {
//     label: string;
//     value: string | number;
// }

// @Component({
//     selector: 'app-asset-management',
//     standalone: true,
//     imports: [CommonModule, FormsModule, TableModule, ButtonModule, ToastModule, DropdownModule, CalendarModule, PaginatorModule, DialogModule, InputTextModule, MenuModule, FontAwesomeModule, RouterModule, DepartmentSelectorComponent],
//     templateUrl: './asset-management.component.html',
//     styleUrls: ['./asset-management.component.scss'],
//     providers: [MessageService]
// })
// export class AssetManagementComponent implements OnInit, OnDestroy {
//     faTrash = faTrash;
//     faPlus = faPlus;
//     faChartBar = faChartBar;
//     faTimes = faTimes;

//     assets: Asset[] = [];
//     filteredAssets: Asset[] = [];
//     categoryOptions: DropdownOption[] = [{ label: 'كل الفئات', value: '' }];
//     statusOptions: DropdownOption[] = [
//         { label: 'كل الحالات', value: '' },
//         { label: 'نشط', value: 'Active' },
//         { label: 'غير نشط', value: 'Inactive' },
//         { label: 'تحت الصيانة', value: 'UnderMaintenance' }
//     ];
//     searchText = '';
//     filterCategory = '';
//     filterStatus = '';
//     filterCreationDateRange: Date[] | null = null;
//     filterModifiedDateRange: Date[] | null = null;
//     filterDepartment: string = '';

//     pageNumber = 1;
//     pageSize = 10;
//     totalCount = 0;

//     selectedDepartment: TreeNode | null = null;
//     showSelector = false;
//     selectedAsset: Asset | null = null;

//     private destroy$ = new Subject<void>();

//     constructor(
//         private messageService: MessageService,
//         private assetsClient: AssetsClient,
//         private http: HttpClient // Inject HttpClient
//     ) {}

//     ngOnInit(): void {
//         this.loadAssets();
//     }

//     ngOnDestroy(): void {
//         this.destroy$.next();
//         this.destroy$.complete();
//     }

//     loadAssets(): void {
//         const creationStart = this.filterCreationDateRange?.[0] || undefined;
//         const creationEnd = this.filterCreationDateRange?.[1] || undefined;
//         const modifiedStart = this.filterModifiedDateRange?.[0] || undefined;
//         const modifiedEnd = this.filterModifiedDateRange?.[1] || undefined;

//         this.assetsClient
//             .getAssetsWithPagination(this.pageNumber, this.pageSize, this.filterCategory || undefined, undefined, this.filterStatus || undefined, undefined, this.filterDepartment || undefined, creationStart, creationEnd, modifiedStart, modifiedEnd)
//             .pipe(takeUntil(this.destroy$))
//             .subscribe({
//                 next: (response: PaginatedListOfAssetBriefDto) => {
//                     this.assets = this.mapApiResponseToAssets(response.items || []);
//                     this.filteredAssets = [...this.assets];
//                     this.totalCount = response.totalCount || 0;
//                     this.categoryOptions = [{ label: 'كل الفئات', value: '' }, ...[...new Set(this.assets.map((a) => a.assetCategory))].sort().map((category) => ({ label: category, value: category }))];
//                 },
//                 error: (error) => {
//                     this.messageService.add({
//                         severity: 'error',
//                         summary: 'خطأ',
//                         detail: 'فشل تحميل الأصول. حاول مرة أخرى.'
//                     });
//                     console.error('Error loading assets:', error);
//                 }
//             });
//     }

//     private mapApiResponseToAssets(items: AssetBriefDto[]): Asset[] {
//         return items.map((item) => ({
//             id: item.name ? parseInt(item.name, 10) || Math.floor(Math.random() * 1000000) : Math.floor(Math.random() * 1000000),
//             assetName: item.assetName || 'غير محدد',
//             serial: item.name || 'غير محدد',
//             department: item.company || 'غير محدد',
//             assetCategory: item.assetCategory || 'غير محدد',
//             status: (item.status as 'Active' | 'Inactive' | 'UnderMaintenance') || 'Active',
//             assetQuantity: item.assetQuantity || 0,
//             creationDate: item.creation ? new Date(item.creation) : null
//         }));
//     }

//     get totalAssets(): number {
//         return this.filteredAssets.length;
//     }

//     get totalCurrentValue(): number {
//         return this.filteredAssets.reduce((sum, a) => sum + a.assetQuantity, 0);
//     }

//     get averageAssetValue(): number {
//         return this.filteredAssets.length ? this.totalCurrentValue / this.filteredAssets.length : 0;
//     }

//     get activeAssetsCount(): number {
//         return this.filteredAssets.filter((a) => a.status === 'Active').length;
//     }

//     get highestValueAsset(): Asset | null {
//         return this.filteredAssets.length ? this.filteredAssets.reduce((prev, curr) => (prev.assetQuantity > curr.assetQuantity ? prev : curr)) : null;
//     }

//     applyFilters(): void {
//         this.pageNumber = 1;
//         this.filteredAssets = this.assets.filter(
//             (asset) =>
//                 (!this.searchText || asset.assetName.toLowerCase().includes(this.searchText.toLowerCase()) || asset.serial.toLowerCase().includes(this.searchText.toLowerCase())) &&
//                 (!this.selectedDepartment || asset.department === this.selectedDepartment.label) &&
//                 (!this.filterCreationDateRange ||
//                     (asset.creationDate && (!this.filterCreationDateRange[0] || asset.creationDate >= this.filterCreationDateRange[0]) && (!this.filterCreationDateRange[1] || asset.creationDate <= this.filterCreationDateRange[1]))) &&
//                 (!this.filterModifiedDateRange ||
//                     (asset.creationDate && (!this.filterModifiedDateRange[0] || asset.creationDate >= this.filterModifiedDateRange[0]) && (!this.filterModifiedDateRange[1] || asset.creationDate <= this.filterModifiedDateRange[1])))
//         );
//         this.loadAssets();
//     }

//     onDepartmentSelect(dept: TreeNode): void {
//         this.selectedDepartment = dept;
//         this.filterDepartment = dept.label || '';
//         this.showSelector = false;
//         this.messageService.add({
//             severity: 'success',
//             summary: 'تم الاختيار',
//             detail: `تم اختيار القسم: ${dept.label}`
//         });
//         this.applyFilters();
//     }

//     clearFilters(): void {
//         this.searchText = '';
//         this.filterDepartment = '';
//         this.selectedDepartment = null;
//         this.filterCategory = '';
//         this.filterStatus = '';
//         this.filterCreationDateRange = null;
//         this.filterModifiedDateRange = null;
//         this.pageNumber = 1;
//         this.loadAssets();
//     }

//     onPageChange(event: any): void {
//         this.pageNumber = event.page + 1;
//         this.pageSize = event.rows;
//         this.loadAssets();
//     }

//     deleteAsset(assetId: number): void {
//         this.assets = this.assets.filter((a) => a.id !== assetId);
//         this.applyFilters();
//         this.messageService.add({
//             severity: 'info',
//             summary: 'تم الحذف',
//             detail: 'تم حذف الأصل بنجاح'
//         });
//     }

//     getAssetActions(asset: Asset): MenuItem[] {
//         return [
//             { label: 'حذف الأصل', icon: 'pi pi-trash', command: () => this.deleteAsset(asset.id) },
//             { label: 'عرض تفاصيل الأصل', icon: 'pi pi-eye', command: () => this.showAssetDetails(asset.id) },
//             { label: 'طباعة التقرير', icon: 'pi pi-file-pdf', command: () => this.printReport(asset.id) },
//             { label: 'إثبات عملية على الأصل', icon: 'pi pi-check-square', command: () => this.proveOperation(asset.id) },
//             { label: 'تحويل إلى قسم', icon: 'pi pi-arrow-right', command: () => this.transferToDepartment(asset.id) },
//             { label: 'طباعة سند تحويل خارجي', icon: 'pi pi-file-export', command: () => this.printTransferDocument(asset.id) },
//             { label: 'نقل العهدة', icon: 'pi pi-share-alt', command: () => this.transferCustody(asset.id) },
//             { label: 'تغيير تبويب الأصل', icon: 'pi pi-cog', command: () => this.changeAssetTab(asset.id) },
//             { label: 'طباعة طلب بيع أصل', icon: 'pi pi-dollar', command: () => this.printSaleRequest(asset.id) }
//         ];
//     }

//     showAssetDetails(id: number): void {
//         this.messageService.add({
//             severity: 'info',
//             summary: 'عرض التفاصيل',
//             detail: `تم عرض تفاصيل الأصل ${id}`
//         });
//     }

//     printReport(id: number): void {
//         this.messageService.add({
//             severity: 'info',
//             summary: 'طباعة التقرير',
//             detail: `تم طباعة تقرير الأصل ${id}`
//         });
//     }

//     proveOperation(id: number): void {
//         this.messageService.add({
//             severity: 'info',
//             summary: 'إثبات العملية',
//             detail: `تم إثبات عملية على الأصل ${id}`
//         });
//     }

//     transferToDepartment(id: number): void {
//         this.messageService.add({
//             severity: 'info',
//             summary: 'تحويل القسم',
//             detail: `تم تحويل الأصل ${id} إلى قسم`
//         });
//     }

//     printTransferDocument(id: number): void {
//         this.messageService.add({
//             severity: 'info',
//             summary: 'طباعة سند التحويل',
//             detail: `تم طباعة سند تحويل الأصل ${id}`
//         });
//     }

//     transferCustody(id: number): void {
//         this.messageService.add({
//             severity: 'info',
//             summary: 'نقل العهدة',
//             detail: `تم نقل عهدة الأصل ${id}`
//         });
//     }

//     changeAssetTab(id: number): void {
//         this.messageService.add({
//             severity: 'info',
//             summary: 'تغيير التبويب',
//             detail: `تم تغيير تبويب الأصل ${id}`
//         });
//     }

//     printSaleRequest(id: number): void {
//         this.messageService.add({
//             severity: 'info',
//             summary: 'طباعة طلب البيع',
//             detail: `تم طباعة طلب بيع الأصل ${id}`
//         });
//     }
// }
