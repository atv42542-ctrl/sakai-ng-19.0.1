import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { TreeModule } from 'primeng/tree';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { DepartmentDto, DepartmentsClient } from '../../../core/services/api-client';

@Component({
    selector: 'app-department-selector',
    standalone: true,
    imports: [FormsModule, TreeModule, InputTextModule, ButtonModule, ToastModule],
    templateUrl: './department-selector.component.html',
    styleUrls: ['./department-selector.component.scss'],
    providers: [MessageService]
})
export class DepartmentSelectorComponent {
    @Output() departmentSelected = new EventEmitter<TreeNode>();
    @Input() canSelectGroup: boolean = false;
    searchValue: string = '';
    treeNodes: TreeNode[] = [];
    departments: DepartmentDto[] = [];
    loading: boolean = false;
    selectedNode: TreeNode | null = null;

    constructor(
        private departmentsClient: DepartmentsClient,
        private messageService: MessageService
    ) {}

    ngOnInit() {
        this.loadDepartments();
    }

    loadDepartments() {
        this.loading = true;

        this.departmentsClient.getDepartmentTree().subscribe({
            next: (data) => {
                this.departments = data;
                this.treeNodes = this.mapToTreeNodes(this.departments);
                this.loading = false;
            },
            error: (err) => {
                this.loading = false;
                this.messageService.add({
                    severity: 'error',
                    summary: 'خطأ',
                    detail: 'فشل في تحميل الأقسام. حاول مرة أخرى.'
                });
                console.error('Error fetching departments', err);
            }
        });
    }

    mapToTreeNodes(data: DepartmentDto[]): TreeNode[] {
        return data.map((item) => ({
            label: item.name,
            expanded: true,
            selectable: item.isGroup ? this.canSelectGroup : !this.canSelectGroup,
            styleClass: item.isGroup ? 'font-bold' : '',
            icon: item.isGroup ? 'pi pi-folder' : 'pi pi-building',
            children: this.mapToTreeNodes(item.children || []),
            data: item
        }));
    }

    filterTree() {
        if (!this.searchValue) {
            this.treeNodes = this.mapToTreeNodes(this.departments);
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

        this.treeNodes = filterFn(this.mapToTreeNodes(this.departments));
    }

    expandAll() {
        console.log('Expanding all nodes');
        this.treeNodes = this.expandRecursive(this.treeNodes, true);
        console.log('Updated treeNodes:', this.treeNodes);
    }

    collapseAll() {
        console.log('Collapsing all nodes');
        this.treeNodes = this.expandRecursive(this.treeNodes, false);
        console.log('Updated treeNodes:', this.treeNodes);
    }

    private expandRecursive(nodes: TreeNode[], isExpand: boolean): TreeNode[] {
        console.log('Processing nodes:', nodes.length, 'isExpand:', isExpand);
        return nodes.map((node) => {
            return {
                ...node,
                expanded: isExpand,
                children: node.children ? this.expandRecursive(node.children, isExpand) : []
            };
        });
    }

    onNodeSelect(event: any) {
        this.selectedNode = event.node;
        this.departmentSelected.emit(event.node);
    }

}
