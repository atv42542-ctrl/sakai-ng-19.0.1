import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Subject, takeUntil } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface Operation {
  id: number;
  operation: string;
  originNumber: string;
  currentValue: number;
  date: string;
  operationInfo: string;
  operationExecutor: string;
  operationStatus: string;
  operationNumber: string;
}

@Component({
  selector: 'app-assets-operation-list',
  standalone: true,
  imports: [CommonModule, TableModule, ButtonModule, ToastModule],
  templateUrl: './assets-operation-list.component.html',
  styleUrls: ['./assets-operation-list.component.scss'],
  providers: [MessageService]
})
export class AssetsOperationListComponent implements OnInit, OnDestroy {
  operations: Operation[] = [];
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadOperations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadOperations(): void {
    this.http.get<Operation[]>('/api/resource/AssetOperations')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.operations = data;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load operations. Please try again.'
          });
          console.error('Error loading operations:', error);
        }
      });
  }

  viewDetails(operation: Operation): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Operation Details',
      detail: `Operation: ${operation.operation}, Status: ${operation.operationStatus}`
    });
  }
}
