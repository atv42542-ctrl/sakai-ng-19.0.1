
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
import { AssetCategoriesService } from '../../Service/asset-categories.service';
import { AssetCategoryDto } from '../../../../core/services/api-client';
import { AssetCategoriesSelectorComponent } from '../../../../shared/components/asset-categories-selector/asset-categories-selector.component';

@Component({
    selector: 'app-add-asset-categories',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, CheckboxModule, TagModule, ToastModule, DialogModule, AssetCategoriesSelectorComponent],
    templateUrl: './add-asset-categories.component.html',
    // styleUrls: ['./add-asset-categories.component.scss'],
    providers: [MessageService]
})
export class AddAssetCategoriesComponent implements OnInit {
    category: any = {
        assetCategoryName: '',
        symbol: '',
        parentName: '',
        isGroup: false
    };

    selectedCategory: TreeNode | null = null;
    showSelector = false;
    isSaved = false;
    loading = false;

    constructor(
        private assetCategoriesService: AssetCategoriesService,
        private messageService: MessageService,
        private router: Router
    ) {}

    ngOnInit(): void {}

    onSave(): void {
        if (!this.category.assetCategoryName) {
            this.messageService.add({
                severity: 'error',
                summary: 'خطأ في التحقق',
                detail: 'يرجى تعبئة جميع الحقول المطلوبة.'
            });
            return;
        }

        this.loading = true;
        this.assetCategoriesService.addAssetCategory(this.category).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'تم الحفظ',
                    detail: 'تم حفظ التصنيف بنجاح'
                });
                this.isSaved = true;
                this.loading = false;
                setTimeout(() => {
                    this.router.navigate(['./assets/category']);
                }, 500);
            },
            error: (error) => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'خطأ',
                    detail: 'فشل حفظ التصنيف. حاول مرة أخرى.'
                });
                this.loading = false;
                console.error('Error saving asset category:', error);
            }
        });
    }

    onCancel(): void {
        this.router.navigate(['./assets/category']);
    }

    onCategorySelect(cat: TreeNode): void {
        this.selectedCategory = cat;
        this.category.parentName = cat.label || '';
        this.showSelector = false;
        this.messageService.add({
            severity: 'success',
            summary: 'تم الاختيار',
            detail: `تم اختيار التصنيف الأب: ${cat.label}`
        });
    }
}
