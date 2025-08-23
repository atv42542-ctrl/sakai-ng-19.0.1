import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AssetCategoriesService } from '../../Service/asset-categories.service';
import { MessageService } from 'primeng/api';
import { AssetCategoryDto } from '../../../../core/services/api-client';
import { Observable } from 'rxjs';

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
    selector: 'app-add-asset-categories',
    templateUrl: './add-asset-categories.component.html',
    styleUrls: ['./add-asset-categories.component.scss'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule]
})
export class AddAssetCategoriesComponent implements OnInit {
    @Input() category?: AssetCategoryDto;
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
        const obs = (this.category?.name 
            ? this.assetCategoriesService.updateAssetCategory(dto) 
            : this.assetCategoriesService.addAssetCategory(dto)) as Observable<void>;
        obs.subscribe({
            next: () => {
                this.messageService.add({ severity: 'success', summary: 'تم الحفظ', detail: 'تم حفظ التصنيف بنجاح' });
                this.saved.emit();
                this.loading = false;
            },
            error: () => {
                this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل حفظ التصنيف' });
                this.loading = false;
            }
        });
    }

    cancel() {
        this.cancelled.emit();
    }
}
