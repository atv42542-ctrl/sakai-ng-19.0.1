import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AssetCategoriesService } from '../../Service/asset-categories.service';
import { MessageService } from 'primeng/api';
import { AssetCategoryDto } from '../../../../core/services/api-client';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-edit-asset-categories',
    templateUrl: './edit-asset-categories.component.html',
    styleUrls: ['./edit-asset-categories.component.scss'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    providers: [MessageService]
})
export class EditAssetCategoriesComponent implements OnInit {
    @Input() category!: AssetCategoryDto;
    @Output() saved = new EventEmitter<void>();
    @Output() cancelled = new EventEmitter<void>();

    form!: FormGroup;
    loading = false;

    constructor(
        private fb: FormBuilder,
        private assetCategoriesService: AssetCategoriesService,
        private messageService: MessageService
    ) {}

    ngOnInit(): void {
        this.form = this.fb.group({
            assetCategoryName: [this.category?.assetCategoryName || '', Validators.required],
            symbol: [this.category?.symbol || ''],
            parentName: [this.category?.parentName || ''],
            isGroup: [this.category?.isGroup || false]
        });
    }

    save() {
        if (this.form.invalid) return;
        this.loading = true;
        const dto: AssetCategoryDto = {
            ...this.category,
            ...this.form.value
        };
        this.assetCategoriesService.updateAssetCategory(dto).subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'تم التعديل', detail: 'تم تعديل التصنيف بنجاح' });
                this.saved.emit();
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تعديل التصنيف' });
                this.loading = false;
            }
        });
    }

    cancel() {
        this.cancelled.emit();
    }
}
