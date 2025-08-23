import { Routes } from '@angular/router';
import { AddAssetCategoriesComponent } from './Component/add-asset-categories/add-asset-categories.component';
import { EditAssetCategoriesComponent } from './Component/edit-asset-categories/edit-asset-categories.component';
import { AssetCategoriesManagementComponent } from './Component/asset-categories-management/asset-categories-management.component';
// import { AddAssetComponent } from './Component/add-asset/add-asset.component';

export const assetRoutes: Routes = [
    // { path: 'add', component: AddAssetComponent },
    // { path: '', component: AssetManagementComponent },
    { path: 'category', component: AssetCategoriesManagementComponent },
    { path: 'category/add', component: AddAssetCategoriesComponent },
    { path: 'category/edit/:id', component: EditAssetCategoriesComponent }
];
