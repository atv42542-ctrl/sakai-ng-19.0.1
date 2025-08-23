import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { TreeModule } from 'primeng/tree';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AssetCategoryDto, AssetCategoriesClient, AssetCategoryTreeDto } from '../../../core/services/api-client';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-asset-categories-selector',
    standalone: true,
    imports: [CommonModule, FormsModule, TreeModule, InputTextModule, ButtonModule, ToastModule],
    templateUrl: './asset-categories-selector.component.html',
    // styleUrls: ['./asset-categories-selector.component.scss'],
    providers: [MessageService]
})
export class AssetCategoriesSelectorComponent {
    @Output() categorySelected = new EventEmitter<TreeNode>();
    @Input() canSelectGroup: boolean = false;
    searchValue: string = '';
    treeNodes: TreeNode[] = [];
    categories: AssetCategoryDto[] = [];
    loading: boolean = false;
    selectedNode: TreeNode | null = null;

    constructor(
        private assetCategoriesClient: AssetCategoriesClient,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadCategories();
    }

    loadCategories() {
        this.loading = true;
        this.assetCategoriesClient.getAssetCategoryTree().subscribe({
            next: (data) => {
                this.categories = data;
                this.treeNodes = this.mapToTreeNodes(this.categories);
                this.loading = false;
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'خطأ',
                    detail: 'فشل في تحميل الفئات. حاول مرة أخرى.'
                });
                console.error('Error fetching categories', err);
            }
        });
    }

    mapToTreeNodes(data: AssetCategoryTreeDto[]): TreeNode[] {
        return data.map((item) => ({
            label: item.name,
            expanded: true,
            selectable: item.isGroup ? this.canSelectGroup : !this.canSelectGroup,
            styleClass: item.isGroup ? 'font-bold' : '',
            icon: item.isGroup ? 'pi pi-folder' : 'pi pi-tag',
            children: this.mapToTreeNodes(item.children || []),
            data: item
        }));
    }

    filterTree() {
        if (!this.searchValue) {
            this.treeNodes = this.mapToTreeNodes(this.categories);
            return;
        }
        const filterFn = (nodes: TreeNode[]): TreeNode[] => {
            return nodes
                .map((node) => {
                    const match = node.label?.toLowerCase().includes(this.searchValue.toLowerCase());
                    const filteredChildren = filterFn(node.children || []);
                    if (match || filteredChildren.length > 0) {
                        return { ...node, children: filteredChildren, expanded: true };
                    }
                    return null;
                })
                .filter((n) => n !== null) as TreeNode[];
        };
        this.treeNodes = filterFn(this.mapToTreeNodes(this.categories));
    }

    expandAll() {
        this.treeNodes = this.expandRecursive(this.treeNodes, true);
    }

    collapseAll() {
        this.treeNodes = this.expandRecursive(this.treeNodes, false);
    }

    private expandRecursive(nodes: TreeNode[], isExpand: boolean): TreeNode[] {
        return nodes.map((node) => ({
            ...node,
            expanded: isExpand,
            children: node.children ? this.expandRecursive(node.children, isExpand) : []
        }));
    }

    onNodeSelect(event: any) {
        this.selectedNode = event.node;
        this.categorySelected.emit(event.node);
    }
}
