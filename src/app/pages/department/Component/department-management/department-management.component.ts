import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TreeModule } from 'primeng/tree';
import { FileUploadModule } from 'primeng/fileupload';
import { MessageService, TreeNode } from 'primeng/api';

// FontAwesome
import { faPlus, faFileExcel, faList, faSitemap, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

// RxJS
import { Subject, takeUntil } from 'rxjs';

// Custom Services & DTOs
import { DepartmentsClient, DepartmentDto, DepartmentListDto } from '../../../../core/services/api-client';
import { LayoutService } from '../../../../layout/service/layout.service';
import { ExcelImportService } from '../../../../shared/services/excel-import.service';

// XLSX
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-department-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ToastModule,
    InputTextModule,
    TreeModule,
    FileUploadModule,
    FontAwesomeModule
  ],
  templateUrl: './department-management.component.html',
  styleUrls: ['./department-management.component.scss'],
  providers: [MessageService]
})
export class DepartmentManagementComponent implements OnInit, OnDestroy {
  // Data
  departments: DepartmentListDto[] = [];
  filteredDepartments: DepartmentListDto[] = [];
  treeNodes: TreeNode[] = [];
  filteredTreeNodes: TreeNode[] = [];
  selectedDepartment: DepartmentDto | null = null;

  // UI states
  isTreeView = false;
  rows = 10;
  filterText = '';
  sortField: string = '';
  sortOrder: number = 1;
  loading = false;

  // Icons
  faPlus = faPlus;
  faFileExcel = faFileExcel;
  faList = faList;
  faSitemap = faSitemap;
  faEdit = faEdit;
  faTrash = faTrash;

  private destroy$ = new Subject<void>();

  constructor(
    private departmentsClient: DepartmentsClient,
    private messageService: MessageService,
    private router: Router,
    private layoutService: LayoutService,
    private excelImportService: ExcelImportService
  ) {}

  get isDarkTheme() {
    return this.layoutService.layoutConfig().darkTheme;
  }

  // ─── Lifecycle ─────────────────────────────────────────────
  ngOnInit(): void {
    this.loadDepartments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ─── Data Loading ──────────────────────────────────────────
  loadDepartments(): void {
    this.loading = true;
    this.departmentsClient
      .getDepartmentList()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.departments = data;
          this.filteredDepartments = [...data];
          this.applySort();
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: 'فشل في تحميل الأقسام. حاول مرة أخرى.'
          });
          console.error('Error loading departments:', error);
        }
      });
  }

  loadTree(): void {
    this.loading = true;
    this.departmentsClient
      .getDepartmentTree()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.treeNodes = this.mapToTreeNodes(data);
          this.filteredTreeNodes = [...this.treeNodes];
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: 'فشل في تحميل شجرة الأقسام. حاول مرة أخرى.'
          });
          console.error('Error loading department tree:', error);
        }
      });
  }

  private mapToTreeNodes(data: DepartmentDto[]): TreeNode[] {
    return data.map((item) => ({
      label: item.name,
      expanded: true,
      selectable: !item.isGroup,
      styleClass: item.isGroup ? 'font-bold' : '',
      icon: item.isGroup ? 'pi pi-folder' : 'pi pi-building',
      children: this.mapToTreeNodes(item.children || [])
    }));
  }

  // ─── UI Actions ────────────────────────────────────────────
  toggleView(): void {
    this.isTreeView = !this.isTreeView;
    this.filterText = '';
    this.isTreeView ? this.loadTree() : this.loadDepartments();
  }

  downloadExcelTemplate(): void {
    try {
      this.loading = true;
      const templateData = [
        ['Name', 'ParentName', 'IsGroup'],
        ['Example Department', '', 'true'],
        ['Sub Department', 'Example Department', 'false']
      ];

      const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(templateData);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');

      XLSX.writeFile(wb, 'DepartmentTemplate.xlsx');
      this.messageService.add({
        severity: 'success',
        summary: 'نجاح',
        detail: 'تم تنزيل نموذج Excel بنجاح.'
      });
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'خطأ',
        detail: 'فشل في تنزيل نموذج Excel. حاول مرة أخرى.'
      });
      console.error('Error downloading Excel template:', error);
    } finally {
      this.loading = false;
    }
  }

  async importExcel(event: any): Promise<void> {
    this.loading = true;
    const importConfig = {
      expectedHeaders: ['Name', 'ParentName', 'IsGroup'],
      entityName: 'Department',
      getExistingData: () => this.departmentsClient.getDepartmentList(),
      createEntity: (entity: any) => {
        const CreateDepartmentDto = (window as any).CreateDepartmentDto || ({} as any);
        if (typeof CreateDepartmentDto.fromJS === 'function') {
          return this.departmentsClient.createDepartment(
            CreateDepartmentDto.fromJS({
              name: entity.Name?.toString().trim(),
              parentName: entity.ParentName?.toString().trim() || '',
              isGroup: entity.IsGroup === 'true' || entity.IsGroup === true || entity.IsGroup === 1
            })
          );
        } else {
          return this.departmentsClient.createDepartment({
            name: entity.Name?.toString().trim(),
            parentName: entity.ParentName?.toString().trim() || '',
            isGroup: entity.IsGroup === 'true' || entity.IsGroup === true || entity.IsGroup === 1
          } as any);
        }
      },
      loadDataMethod: () => this.isTreeView ? this.loadTree() : this.loadDepartments()

    };

    try {
      await this.excelImportService.importExcel(event, importConfig);
    } catch (error) {
      this.messageService.add({
        severity: 'error',
        summary: 'خطأ',
        detail: 'فشل في استيراد ملف Excel.'
      });
    } finally {
      this.loading = false;
    }
  }

  // ─── CRUD Actions ──────────────────────────────────────────
  deleteDepartment(department: DepartmentDto): void {
    this.messageService.add({
      severity: 'info',
      summary: 'معلومات',
      detail: `وظيفة حذف ${department.name} لم يتم تنفيذها بعد.`
    });
  }

  editDepartment(department: DepartmentDto): void {
    this.messageService.add({
      severity: 'info',
      summary: 'معلومات',
      detail: `وظيفة تعديل ${department.name} لم يتم تنفيذها بعد.`
    });
  }

  navigateToAddDepartment(): void {
    this.router.navigate(['./department/add-department']);
  }

  // ─── Table/Tree Helpers ────────────────────────────────────
  onRowsChange(event: any): void {
    this.rows = event.value;
  }

  expandAll(): void {
    this.filteredTreeNodes = this.expandNodes(this.filteredTreeNodes, true);
  }

  collapseAll(): void {
    this.filteredTreeNodes = this.expandNodes(this.filteredTreeNodes, false);
  }

  private expandNodes(nodes: TreeNode[], expanded: boolean): TreeNode[] {
    return nodes.map((node) => ({
      ...node,
      expanded,
      children: node.children ? this.expandNodes(node.children, expanded) : []
    }));
  }

  filterTree(): void {
    if (!this.filterText.trim()) {
      this.filteredTreeNodes = [...this.treeNodes];
      return;
    }

    const filterTextLower = this.filterText.toLowerCase();
    this.filteredTreeNodes = this.filterNodes(this.treeNodes, filterTextLower);
  }

  private filterNodes(nodes: TreeNode[], filterText: string): TreeNode[] {
    return nodes
      .map((node) => ({
        ...node,
        children: node.children ? this.filterNodes(node.children, filterText) : []
      }))
      .filter((node) =>
        node.label?.toLowerCase().includes(filterText) ||
        (node.children && node.children.length > 0)
      );
  }

  filterTable(): void {
    if (!this.filterText.trim()) {
      this.filteredDepartments = [...this.departments];
      this.applySort();
      return;
    }

    const filterTextLower = this.filterText.toLowerCase();
    this.filteredDepartments = this.departments.filter((dept) =>
      (dept.name?.toLowerCase().includes(filterTextLower) ||
       dept.parentDepartment?.toLowerCase().includes(filterTextLower))
    );
    this.applySort();
  }

  onSort(event: any): void {
    this.sortField = event.field;
    this.sortOrder = event.order;
    this.applySort();
  }

  private applySort(): void {
    if (!this.sortField) {
      this.filteredDepartments = [...this.filteredDepartments];
      return;
    }

    this.filteredDepartments.sort((a, b) => {
      const valueA = a[this.sortField as keyof DepartmentListDto];
      const valueB = b[this.sortField as keyof DepartmentListDto];

      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return this.sortOrder * -1;
      if (valueB == null) return this.sortOrder;

      if (this.sortField === 'name' || this.sortField === 'parentDepartment') {
        return this.sortOrder * (valueA as string).localeCompare(valueB as string);
      }

      if (this.sortField === 'isGroup') {
        return this.sortOrder * ((valueA as boolean) === (valueB as boolean) ? 0 : valueA ? -1 : 1);
      }

      return 0;
    });
  }
}
