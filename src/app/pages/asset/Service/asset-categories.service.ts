import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AssetCategoriesClient, AssetCategoryDto, CreateAssetCategoryCommand, PaginatedListOfAssetCategoryBriefDto, UpdateAssetCategoryCommand, AssetCategoryTreeDto, AssetCategoryBriefDto } from '../../../core/services/api-client';

@Injectable({
    providedIn: 'root'
})
export class AssetCategoriesService {
    constructor(private api: AssetCategoriesClient) {}

    // Fetch all categories with Pagination
    getAllAssetCategories(pageNumber: number = 1, pageSize: number = 10, searchTerm?: string): Observable<PaginatedListOfAssetCategoryBriefDto> {
        return this.api.getAssetCategoriesWithPagination(pageNumber, pageSize, searchTerm);
    }

    // Fetch a specific category by name
    getAssetCategoryByName(name: string): Observable<AssetCategoryDto> {
        return this.api.getAssetCategory(name);
    }

    // Fetch all categories as a tree structure
    getAssetCategoryTree(): Observable<AssetCategoryTreeDto[]> {
        return this.api.getAssetCategoryTree();
    }

    // Fetch all categories as a flat list
    getAssetCategoryList(): Observable<AssetCategoryBriefDto[]> {
        return this.api.getAssetCategoryList();
    }

    // Add a new category
    addAssetCategory(dto: CreateAssetCategoryCommand): Observable<string> {
        return this.api.createAssetCategory(dto as any);
    }

    // Update an existing category
    updateAssetCategory(dto: UpdateAssetCategoryCommand): Observable<void> {
        return this.api.updateAssetCategory(dto.name!, dto as any);
    }

    // Delete a category
    deleteAssetCategory(name: string): Observable<void> {
        return this.api.deleteAssetCategory(name);
    }
}