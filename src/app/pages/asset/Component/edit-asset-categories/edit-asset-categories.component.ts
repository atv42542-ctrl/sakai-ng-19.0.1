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
import { Router, ActivatedRoute } from '@angular/router';
import { AssetCategoriesService } from '../../Service/asset-categories.service';
import { AssetCategoryDto } from '../../../../core/services/api-client';
import { AssetCategoriesSelectorComponent } from '../../../../shared/components/asset-categories-selector/asset-categories-selector.component';

@Component({
    selector: 'app-edit-asset-categories',
    standalone: true,
    imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, CheckboxModule, TagModule, ToastModule, DialogModule ,AssetCategoriesSelectorComponent],
    templateUrl: './edit-asset-categories.component.html',
    styleUrls: ['./edit-asset-categories.component.scss'],
    providers: [MessageService]
})
export class EditAssetCategoriesComponent implements OnInit {
    category: any = {
        id: '',
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
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit(): void {
        // Load category by name from route params if needed
        const name = this.route.snapshot.paramMap.get('id');
        if (name) {
            this.loading = true;
            this.assetCategoriesService.getAssetCategoryByName(name).subscribe({
                next: (cat: any) => {
                    this.category = { ...cat };
                    this.loading = false;
                },
                error: () => {
                    this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل بيانات التصنيف' });
                    this.loading = false;
                }
            });
        }
    }

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
        this.assetCategoriesService.updateAssetCategory(this.category).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'تم التعديل',
                    detail: 'تم تعديل التصنيف بنجاح'
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
                    detail: 'فشل تعديل التصنيف. حاول مرة أخرى.'
                });
                this.loading = false;
                console.error('Error updating asset category:', error);
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
