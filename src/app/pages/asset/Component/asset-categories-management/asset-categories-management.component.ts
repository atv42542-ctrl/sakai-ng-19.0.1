import { Component, OnInit, OnDestroy } from '@angular/core';
import { AssetCategoriesService } from '../../Service/asset-categories.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AssetCategoryDto, AssetCategoryTreeDto, AssetCategoryBriefDto, PaginatedListOfAssetCategoryBriefDto } from '../../../../core/services/api-client';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { TreeModule } from 'primeng/tree';
import { FileUploadModule } from 'primeng/fileupload';
import { AddAssetCategoriesComponent } from '../add-asset-categories/add-asset-categories.component';
import { EditAssetCategoriesComponent } from '../edit-asset-categories/edit-asset-categories.component';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import * as XLSX from 'xlsx';
import { LayoutService } from '../../../../layout/service/layout.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-asset-categories-management',
    templateUrl: './asset-categories-management.component.html',
    styleUrls: ['./asset-categories-management.component.scss'],
    imports: [CommonModule, TableModule, ButtonModule, ToastModule, InputTextModule, FormsModule, TreeModule, FileUploadModule, DialogModule],
    standalone: true,
    providers: [ConfirmationService, MessageService]
})
export class AssetCategoriesManagementComponent implements OnInit, OnDestroy {
    assetCategories: AssetCategoryBriefDto[] = [];
    filteredCategories: AssetCategoryBriefDto[] = [];
    treeNodes: any[] = [];
    filteredTreeNodes: any[] = [];
    selectedCategory: AssetCategoryBriefDto | null = null;
    isTreeView = false;
    rows = 10;
    filterText = '';
    sortField: string = '';
    sortOrder: number = 1;
    loading: boolean = false;
    displayAddDialog = false;
    displayEditDialog = false;
    private destroy$ = new Subject<void>();

    constructor(
        private assetCategoriesService: AssetCategoriesService,
        private confirmationService: ConfirmationService,
        private messageService: MessageService,
        private layoutService: LayoutService,
        private router: Router
    ) {}

    get isDarkTheme() {
        return this.layoutService.layoutConfig().darkTheme;
    }

    ngOnInit(): void {
        this.loadCategories();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadCategories(): void {
        this.loading = true;
        this.assetCategoriesService.getAssetCategoryList().subscribe({
            next: (data: AssetCategoryBriefDto[]) => {
                this.assetCategories = data || [];
                this.filteredCategories = [...this.assetCategories];
                this.applySort();
                this.loading = false;
            },
            error: (error) => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل التصنيفات' });
                console.error('Error loading asset categories:', error);
            }
        });
    }

    loadTree(): void {
        this.loading = true;
        this.assetCategoriesService.getAssetCategoryTree().subscribe({
            next: (data: AssetCategoryTreeDto[]) => {
                this.treeNodes = this.mapToTreeNodes(data);
                this.filteredTreeNodes = [...this.treeNodes];
                this.loading = false;
            },
            error: (error) => {
                this.loading = false;
                this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل شجرة التصنيفات' });
                console.error('Error loading asset category tree:', error);
            }
        });
    }

    // لم تعد هناك حاجة لبناء الشجرة يدوياً لأن API يعيدها كشجرة

    mapToTreeNodes(data: AssetCategoryTreeDto[]): any[] {
        return data.map((item) => ({
            label: item.assetCategoryName,
            expanded: true,
            selectable: !item.isGroup,
            styleClass: item.isGroup ? 'font-bold' : '',
            icon: item.isGroup ? 'pi pi-folder' : 'pi pi-tag',
            children: item.children ? this.mapToTreeNodes(item.children) : []
        }));
    }

    toggleView(): void {
        this.isTreeView = !this.isTreeView;
        this.filterText = '';
        if (this.isTreeView) {
            this.loadTree();
        } else {
            this.loadCategories();
        }
    }

    filterTree(): void {
        if (!this.filterText.trim()) {
            this.filteredTreeNodes = [...this.treeNodes];
            return;
        }
        const filterTextLower = this.filterText.toLowerCase();
        this.filteredTreeNodes = this.filterNodes(this.treeNodes, filterTextLower);
    }

    private filterNodes(nodes: any[], filterText: string): any[] {
        return nodes
            .map((node) => ({
                ...node,
                children: node.children ? this.filterNodes(node.children, filterText) : []
            }))
            .filter((node) => node.label?.toLowerCase().includes(filterText) || (node.children && node.children.length > 0));
    }

    filterTable(): void {
        if (!this.filterText.trim()) {
            this.filteredCategories = [...this.assetCategories];
            this.applySort();
            return;
        }
        const filterTextLower = this.filterText.toLowerCase();
        this.filteredCategories = this.assetCategories.filter((cat) => cat.assetCategoryName?.toLowerCase().includes(filterTextLower) || cat.symbol?.toLowerCase().includes(filterTextLower));
        this.applySort();
    }

    onSort(event: any): void {
        this.sortField = event.field;
        this.sortOrder = event.order;
        this.applySort();
    }

    private applySort(): void {
        if (!this.sortField) {
            this.filteredCategories = [...this.filteredCategories];
            return;
        }
        this.filteredCategories.sort((a, b) => {
            let valueA: any;
            let valueB: any;
            if (this.sortField === 'assetCategoryName') {
                valueA = a.assetCategoryName;
                valueB = b.assetCategoryName;
            } else if (this.sortField === 'symbol') {
                valueA = a.symbol;
                valueB = b.symbol;
            } else if (this.sortField === 'isGroup') {
                valueA = a.isGroup ? 1 : 0;
                valueB = b.isGroup ? 1 : 0;
            } else {
                valueA = '';
                valueB = '';
            }
            if (valueA == null && valueB == null) return 0;
            if (valueA == null) return 1;
            if (valueB == null) return -1;
            if (typeof valueA === 'string' && typeof valueB === 'string') {
                return this.sortOrder * valueA.localeCompare(valueB);
            }
            if (typeof valueA === 'number' && typeof valueB === 'number') {
                return this.sortOrder * (valueA - valueB);
            }
            return 0;
        });
    }

    navigateToAddcategory(): void {
        this.router.navigate(['assets/category/add']);
    }

    navigateToEditcategory(category: AssetCategoryBriefDto): void {
        this.router.navigate(['assets/category/edit', category.assetCategoryName]);
    }


    // Excel Template Download
    downloadExcelTemplate(): void {
        try {
            this.loading = true;
            const templateData = [
                ['assetCategoryName', 'parentName', 'isGroup'],
                ['تصنيف رئيسي', '', 'true'],
                ['تصنيف فرعي', 'تصنيف رئيسي', 'false']
            ];
            const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(templateData);
            const wb: XLSX.WorkBook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Template');
            XLSX.writeFile(wb, 'AssetCategoryTemplate.xlsx');
            this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم تنزيل نموذج Excel بنجاح.' });
        } catch (error) {
            this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في تنزيل نموذج Excel.' });
        } finally {
            this.loading = false;
        }
    }

    // Excel Import
    importExcel(event: any): void {
        const file: File = event.files[0];
        if (!file) {
            this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'لم يتم اختيار ملف.' });
            return;
        }
        this.loading = true;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: ['assetCategoryName', 'parentName', 'isGroup'], defval: '' });
                // تحقق من الأعمدة
                const expectedHeaders = ['assetCategoryName', 'parentName', 'isGroup'];
                const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
                if (!headers || headers.length < expectedHeaders.length || !expectedHeaders.every((h, i) => h === headers[i])) {
                    this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'ترتيب الأعمدة غير صحيح. يجب أن تكون: assetCategoryName, parentName, isGroup' });
                    this.loading = false;
                    return;
                }
                // هنا يمكنك إرسال البيانات إلى السيرفر أو معالجتها حسب الحاجة
                this.messageService.add({ severity: 'success', summary: 'نجاح', detail: 'تم استيراد الملف بنجاح (معالجة وهمية).' });

                console.log('Imported Data:', jsonData.slice(1)); // تخطي الصف الأول (الرؤوس)
                // يمكنك استدعاء خدمة لإرسال البيانات إلى السيرفر هنا   
                
            } catch (error) {
                this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل في قراءة ملف Excel.' });
            } finally {
                this.loading = false;
            }
        };
        reader.readAsArrayBuffer(file);
    }

    // Expand/Collapse Tree
    expandAll(): void {
        this.filteredTreeNodes = this.expandNodes(this.filteredTreeNodes, true);
    }

    collapseAll(): void {
        this.filteredTreeNodes = this.expandNodes(this.filteredTreeNodes, false);
    }

    private expandNodes(nodes: any[], expanded: boolean): any[] {
        return nodes.map((node) => ({
            ...node,
            expanded,
            children: node.children ? this.expandNodes(node.children, expanded) : []
        }));
    }

    deleteCategory(category: AssetCategoryDto) {
        this.confirmationService.confirm({
            message: `هل أنت متأكد من حذف التصنيف؟`,
            accept: () => {
                this.assetCategoriesService.deleteAssetCategory(category.name!).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'تم الحذف', detail: 'تم حذف التصنيف بنجاح' });
                        this.loadCategories();
                    },
                    error: () => this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل حذف التصنيف' })
                });
            }
        });
    }

    onCategoryAdded() {
        this.displayAddDialog = false;
        this.loadCategories();
    }

    onCategoryUpdated() {
        this.displayEditDialog = false;
        this.loadCategories();
    }
}
