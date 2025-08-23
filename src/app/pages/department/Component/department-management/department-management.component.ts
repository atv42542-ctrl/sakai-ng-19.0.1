import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { DepartmentsClient, DepartmentDto, DepartmentListDto, CreateDepartmentListCommand, CreateDepartmentDto } from '../../../../core/services/api-client';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TreeModule } from 'primeng/tree';
import { TreeNode } from 'primeng/api';
import { FileUploadModule } from 'primeng/fileupload';
import * as XLSX from 'xlsx';
import { faPlus, faFileExcel, faList, faSitemap, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LayoutService } from '../../../../layout/service/layout.service';

@Component({
  selector: 'app-department-management',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    ToastModule,
    InputTextModule,
    FormsModule,
    TreeModule,
    FileUploadModule,
    FontAwesomeModule
  ],
  templateUrl: './department-management.component.html',
  styleUrls: ['./department-management.component.scss'],
  providers: [MessageService]
})
export class DepartmentManagementComponent implements OnInit, OnDestroy {
  departments: DepartmentListDto[] = [];
  filteredDepartments: DepartmentListDto[] = [];
  treeNodes: TreeNode[] = [];
  filteredTreeNodes: TreeNode[] = [];
  selectedDepartment: DepartmentDto | null = null;
  isTreeView = false;
  rows = 10;
  filterText = '';
  sortField: string = '';
  sortOrder: number = 1; // 1 for ascending, -1 for descending
  loading: boolean = false; // Loading state
  private destroy$ = new Subject<void>();

  faPlus = faPlus;
  faFileExcel = faFileExcel;
  faList = faList;
  faSitemap = faSitemap;
  faEdit = faEdit;
  faTrash = faTrash;

  constructor(
      private departmentsClient: DepartmentsClient,
      private messageService: MessageService,
      private router: Router,
      private layoutService: LayoutService
    ) {}

  get isDarkTheme() {
    return this.layoutService.layoutConfig().darkTheme;
  }


  ngOnInit(): void {
    this.loadDepartments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

  mapToTreeNodes(data: DepartmentDto[]): TreeNode[] {
    return data.map((item) => ({
      label: item.name,
      expanded: true,
      selectable: !item.isGroup,
      styleClass: item.isGroup ? 'font-bold' : '',
      icon: item.isGroup ? 'pi pi-folder' : 'pi pi-building',
      children: this.mapToTreeNodes(item.children || [])
    }));
  }

  toggleView(): void {
    this.isTreeView = !this.isTreeView;
    this.filterText = ''; // Reset filter when switching views
    if (this.isTreeView) {
      this.loadTree();
    } else {
      this.loadDepartments();
    }
  }

  downloadExcelTemplate(): void {
    try {
      this.loading = true;
      console.log('Downloading Excel template...');
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

  importExcel(event: any): void {
    const file: File = event.files[0];
    if (!file) {
      this.messageService.add({
        severity: 'error',
        summary: 'خطأ',
        detail: 'لم يتم اختيار ملف.'
      });
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
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: ['Name', 'ParentName', 'IsGroup'], defval: '' });

        // Validate columns
        const expectedHeaders = ['Name', 'ParentName', 'IsGroup'];
        const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
        if (!headers || headers.length < expectedHeaders.length || !expectedHeaders.every((h, i) => h === headers[i])) {
          this.messageService.add({
            severity: 'error',
            summary: 'خطأ',
            detail: 'ترتيب الأعمدة غير صحيح. يجب أن تكون: Name, ParentName, IsGroup'
          });
          this.loading = false;
          return;
        }

        // Convert data to CreateDepartmentDto objects
        const departments: CreateDepartmentDto[] = jsonData.slice(1).map((row: any) =>
          CreateDepartmentDto.fromJS({
            name: row.Name?.toString().trim(),
            parentName: row.ParentName?.toString().trim() || '',
            isGroup: row.IsGroup === 'true' || row.IsGroup === true || row.IsGroup === 1
          })
        );

        // Check for empty or duplicate names within the file
        const nameSet = new Set<string>();
        for (const dept of departments) {
          if (!dept.name) {
            this.messageService.add({
              severity: 'error',
              summary: 'خطأ',
              detail: 'يوجد قسم بدون اسم.'
            });
            this.loading = false;
            return;
          }
          if (nameSet.has(dept.name)) {
            this.messageService.add({
              severity: 'error',
              summary: 'خطأ',
              detail: `اسم القسم "${dept.name}" مكرر في الملف.`
            });
            this.loading = false;
            return;
          }
          nameSet.add(dept.name);
        }

        // Check for duplicate names in the database
        this.departmentsClient.getDepartmentList().subscribe({
          next: (existingDepartments) => {
            const existingNames = new Set(existingDepartments.map((d) => d.name));
            for (const dept of departments) {
              if (existingNames.has(dept.name)) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'خطأ',
                  detail: `اسم القسم "${dept.name}" موجود مسبقًا في قاعدة البيانات.`
                });
                this.loading = false;
                return;
              }
            }

            // Check that ParentName refers to an IsGroup department
            const groupNames = new Set(departments.filter((d) => d.isGroup).map((d) => d.name));
            for (const dept of departments) {
              if (dept.parentName && !groupNames.has(dept.parentName) && !existingDepartments.some((d) => d.name === dept.parentName && d.isGroup)) {
                this.messageService.add({
                  severity: 'error',
                  summary: 'خطأ',
                  detail: `القسم الأب "${dept.parentName}" غير موجود أو ليس مجموعة.`
                });
                this.loading = false;
                return;
              }
            }

            // Send data to the server
            const command = new CreateDepartmentListCommand({ departments });
            this.departmentsClient.createDepartmentList(command).subscribe({
              next: () => {
                this.messageService.add({
                  severity: 'success',
                  summary: 'نجاح',
                  detail: 'تم رفع الأقسام بنجاح.'
                });
                this.loadDepartments();
              },
              error: (error) => {
                this.messageService.add({
                  severity: 'error',
                  summary: 'خطأ',
                  detail: 'فشل في رفع الأقسام. حاول مرة أخرى.'
                });
                console.error('Error uploading departments:', error);
                this.loading = false;
              }
            });
          },
          error: (error) => {
            this.messageService.add({
              severity: 'error',
              summary: 'خطأ',
              detail: 'فشل في التحقق من الأقسام الموجودة. حاول مرة أخرى.'
            });
            console.error('Error checking existing departments:', error);
            this.loading = false;
          }
        });
      } catch (error) {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'فشل في معالجة ملف Excel. تأكد من صحة الملف.'
        });
        console.error('Error processing Excel file:', error);
        this.loading = false;
      }
    };
    reader.readAsArrayBuffer(file);
  }

  deleteDepartment(department: DepartmentDto): void {
    this.messageService.add({
      severity: 'info',
      summary: 'معلومات',
      detail: `وظيفة حذف ${department.name} لم يتم تنفيذها بعد.`
    });
  }

  navigateToAddDepartment(): void {
    this.router.navigate(['./department/add-department']);
  }

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
      .filter((node) => node.label?.toLowerCase().includes(filterText) || (node.children && node.children.length > 0));
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

      // Handle null or undefined values
      if (valueA == null && valueB == null) return 0;
      if (valueA == null) return this.sortOrder * -1;
      if (valueB == null) return this.sortOrder;

      // Sort strings for name and parentDepartment
      if (this.sortField === 'name' || this.sortField === 'parentDepartment') {
        return this.sortOrder * (valueA as string).localeCompare(valueB as string);
      }

      // Sort boolean for isGroup
      if (this.sortField === 'isGroup') {
        return this.sortOrder * ((valueA as boolean) === (valueB as boolean) ? 0 : valueA ? -1 : 1);
      }

      return 0;
    });
  }

  editDepartment(department: DepartmentDto): void {
    this.messageService.add({
      severity: 'info',
      summary: 'معلومات',
      detail: `وظيفة تعديل ${department.name} لم يتم تنفيذها بعد.`
    });
  }
}