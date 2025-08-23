import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, TemplateRef, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToolbarModule } from 'primeng/toolbar';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { BehaviorSubject } from 'rxjs';

export interface ItemWithId {
  id?: string | number;
  [key: string]: any;
}


export interface ColumnDef {
  field: string;
  header: string;
  sortable?: boolean;
  width?: string;
  renderer?: (row: any) => string; 
}

@Component({
  selector: 'app-generic-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    ToolbarModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ConfirmDialogModule
  ],
  providers: [ConfirmationService],
  templateUrl: './generic-table.component.html',
  styleUrls: ['./generic-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericTableComponent<T extends ItemWithId> implements OnInit, OnChanges {
  @Input() data: T[] = [];
  @Input() rows: number = 10;
  @Input() columns: ColumnDef[] = [];
  @Input() isPaginator: boolean = true;
  @Input() rowsPerPageOptions: number[] = [5, 10, 20, 50];
  @Input() dataKey: string = 'id';
  @Input() title: string = '';
  @Input() isToolbar: boolean = true;
  @Input() actionsTemplateRef: TemplateRef<any> | null = null;
  @Input() totalRecords: number = 0;
  @Input() lazy: boolean = false;

  @Output() edit = new EventEmitter<T>();
  @Output() delete = new EventEmitter<T>();
  @Output() deleteSelected = new EventEmitter<T[]>();
  @Output() lazyLoad = new EventEmitter<any>();
  @Output() create = new EventEmitter<void>(); // New event for the New button 
  @Output() export = new EventEmitter<void>(); // New event for the Export button 

  selectedRows: T[] = [];
  globalFilterFields: string[] = [];
  filterValue: string = '';
  private tableState = new BehaviorSubject<any>({});

  constructor(private confirmationService: ConfirmationService) { }

  ngOnInit() {
    this.globalFilterFields = this.columns.map((col) => col.field);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data) {
      this.validateData();
    }
    if (changes['columns']) {
      this.globalFilterFields = this.columns.map((col) => col.field);
    }
  }

  private validateData(): void {
    if (!Array.isArray(this.data)) {
      console.warn('Input "data" must be an array.');
      this.data = [];
    }
    if (!this.dataKey || !this.columns.some(col => col.field === this.dataKey)) {
      console.warn('Invalid dataKey provided. Ensure it matches a column field.');
    }
    this.data.forEach(item => {
      if (this.dataKey === 'id' && item.id === undefined) {
        console.warn('Some data items have undefined id, which may cause issues.');
      }
    });
  }

  clear(table: any) {
    table.clear();
    this.filterValue = '';
  }

  onGlobalFilter(table: any, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    table.filterGlobal(value, 'contains');
  }

  onEdit(row: T) {
    this.edit.emit(row);
  }

  onDelete(row: T) {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this history?',
      header: 'confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.delete.emit(row);
      }
    });
  }

  deleteSelectedRows() {
    this.confirmationService.confirm({
      message: `Are you sure to delete ${this.selectedRows.length} record?`,
      header: 'confirm',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteSelected.emit(this.selectedRows);
        this.selectedRows = [];
      }
    });
  }

  onCreate() {
    this.create.emit();
  }

  onExport() {
    this.export.emit();
  }

  onLazyLoad(event: any) {
    this.tableState.next({
      first: event.first,
      rows: event.rows,
      sortField: event.sortField,
      sortOrder: event.sortOrder,
      filters: event.filters
    });
    this.lazyLoad.emit(event);
  }

  restoreState(): any {
    return this.tableState.value;
  }
}