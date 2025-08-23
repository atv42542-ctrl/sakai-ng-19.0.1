import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService, TreeNode } from 'primeng/api';
import { Router } from '@angular/router';
import { DepartmentSelectorComponent } from '../../../../shared/components/department-selector/department-selector.component';
import { CreateDepartmentCommand, DepartmentsClient } from '../../../../core/services/api-client';

@Component({
    selector: 'app-add-department',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, CheckboxModule, TagModule, ToastModule, DialogModule, DepartmentSelectorComponent],
    templateUrl: './add-department.component.html',
    styleUrls: ['./add-department.component.scss'],
    providers: [MessageService]
})
export class AddDepartmentComponent implements OnInit {
    department = {
        name: '',
        company: 'malia',
        parentDepartment: '',
        isGroup: false,
        disabled: false
    };

    selectedDepartment: TreeNode | null = null;
    showSelector = false;

    isSaved = false;

    constructor(
        private departmentsClient: DepartmentsClient,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit(): void {}

    onSave(): void {
        if (!this.department.name || !this.department.company) {
            this.messageService.add({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Please fill in all required fields.'
            });
            return;
        }

        const request = new CreateDepartmentCommand({
            name: this.department.name,
            isGroup: this.department.isGroup,
            parentName: this.department.parentDepartment
        });

        this.departmentsClient.createDepartment(request).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Success',
                    detail: 'Department saved successfully'
                });
                this.isSaved = true;
                setTimeout(() => {
                    this.router.navigate(['./department']);
                }, 500);
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to save department. Please try again.'
                });
                console.error('Error saving department:', error);
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['/department']);
    }

    onDepartmentSelect(dept: TreeNode): void {
        this.selectedDepartment = dept;
        this.department.parentDepartment = dept.label || '';
        this.showSelector = false;
        this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Parent department selected: ${dept.label}`
        });
    }
}
