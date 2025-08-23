
import { Component, OnInit } from '@angular/core';
import { AssetCategoriesService } from '../../Service/asset-categories.service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { AssetCategoryDto } from '../../../../core/services/api-client';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { AddAssetCategoriesComponent } from '../add-asset-categories/add-asset-categories.component';
import { EditAssetCategoriesComponent } from '../edit-asset-categories/edit-asset-categories.component';

@Component({
  selector: 'app-asset-categories-management',
  templateUrl: './asset-categories-management.component.html',
  styleUrls: ['./asset-categories-management.component.scss'],
  imports: [
    TableModule,
    ButtonModule,
    DialogModule,
    AddAssetCategoriesComponent,
  ],
  standalone: true,
  providers: [ConfirmationService, MessageService]
})
export class AssetCategoriesManagementComponent implements OnInit {
  assetCategories: AssetCategoryDto[] = [];
  selectedCategory: AssetCategoryDto | null = null;
  displayAddDialog = false;
  displayEditDialog = false;

  constructor(
    private assetCategoriesService: AssetCategoriesService,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.loadAssetCategories();
  }

  loadAssetCategories() {
    this.assetCategoriesService.getAllAssetCategories().subscribe({
      next: (data) => (this.assetCategories = data.items || []),
      error: () => this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل تحميل التصنيفات' })
    });
  }

  showAddDialog() {
    this.displayAddDialog = true;
  }

  showEditDialog(category: AssetCategoryDto) {
    this.selectedCategory = { 
      ...category, 
      init: category.init?.bind(category) || (() => {}), 
      toJSON: category.toJSON?.bind(category) || (() => ({})) 
    };
    this.displayEditDialog = true;
  }

  deleteCategory(category: AssetCategoryDto) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف التصنيف؟`,
      accept: () => {
        this.assetCategoriesService.deleteAssetCategory(category.name!).subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'تم الحذف', detail: 'تم حذف التصنيف بنجاح' });
            this.loadAssetCategories();
          },
          error: () => this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'فشل حذف التصنيف' })
        });
      }
    });
  }

  onCategoryAdded() {
    this.displayAddDialog = false;
    this.loadAssetCategories();
  }

  onCategoryUpdated() {
    this.displayEditDialog = false;
    this.loadAssetCategories();
  }
}
