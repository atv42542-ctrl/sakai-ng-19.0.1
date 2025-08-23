import { Routes } from '@angular/router';
import { DepartmentManagementComponent } from './Component/department-management/department-management.component';
import { AddDepartmentComponent } from './Component/add-department/add-department.component';


export const departmentRoutes: Routes = [
    { path: '', component: DepartmentManagementComponent },
    { path: 'add-department', component: AddDepartmentComponent },
];