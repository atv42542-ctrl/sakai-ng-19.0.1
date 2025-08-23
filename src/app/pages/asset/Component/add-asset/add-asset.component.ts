// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { ButtonModule } from 'primeng/button';
// import { InputTextModule } from 'primeng/inputtext';
// import { DialogModule } from 'primeng/dialog';
// import { CalendarModule } from 'primeng/calendar';
// import { ToastModule } from 'primeng/toast';
// import { MessageService, TreeNode } from 'primeng/api';
// import { Subject, takeUntil } from 'rxjs';
// import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
// import { faPlus } from '@fortawesome/free-solid-svg-icons';
// import { DepartmentSelectorComponent } from '../../../../shared/components/department-selector/department-selector.component';
// import { ToastService } from '../../../../core/services/toast.service';
// import { Router } from '@angular/router';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-add-asset',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     ButtonModule,
//     InputTextModule,
//     DialogModule,
//     CalendarModule,
//     ToastModule,
//     FontAwesomeModule,
//     DepartmentSelectorComponent
//   ],
//   templateUrl: './add-asset.component.html',
//   styleUrls: ['./add-asset.component.scss'],
//   providers: []
// })
// export class AddAssetComponent implements OnInit, OnDestroy {
//   faPlus = faPlus;

//   assetName = '';
//   serial = '';
//   countryOfManufacture = '';
//   yearOfManufacture: number | null = null;
//   manufacturer = '';
//   model = '';
//   count = 0;
//   initialValue = 0;
//   currentValue = 0;
//   ownershipRatio = 0;
//   date: Date | null = null;
//   itemName = '';
//   selectedDepartment: TreeNode | null = null;
//   showSelector = false;
//   formTouched = false;
//   currentYear = new Date().getFullYear();

//   private destroy$ = new Subject<void>();

//   constructor(
//     private toastService: ToastService,
//     // private assetsClient: AssetsClient,
//     private router: Router
//   ) {}

//   ngOnInit(): void {
//     this.initializeForm();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   initializeForm(): void {
//     this.resetForm();
//   }

//   get formValid(): boolean {
//     return (
//       !!this.assetName &&
//       !!this.serial &&
//       !!this.countryOfManufacture &&
//       this.yearOfManufacture !== null &&
//       this.yearOfManufacture >= 1900 &&
//       this.yearOfManufacture <= this.currentYear &&
//       !!this.manufacturer &&
//       !!this.model &&
//       this.count > 0 &&
//       this.initialValue >= 0 &&
//       this.currentValue >= 0 &&
//       this.ownershipRatio >= 0 &&
//       this.ownershipRatio <= 100 &&
//       !!this.date &&
//       !!this.itemName &&
//       !!this.selectedDepartment
//     );
//   }

//   onDepartmentSelect(dept: TreeNode): void {
//     this.selectedDepartment = dept;
//     this.showSelector = false;
//     this.toastService.show(`تم اختيار القسم: ${dept.label}`, 'success');
//   }

//   onAddAsset(): void {
//     this.formTouched = true;
//     if (!this.formValid) {
//       this.toastService.show('يرجى ملء جميع الحقول المطلوبة بشكل صحيح.', 'error');
//       return;
//     }

//     const command = new CreateAssetCommand({
//       name: this.serial,
//       assetName: this.assetName,
//       assetCategory: this.itemName,
//       assetOwner: this.manufacturer,
//       assetQuantity: this.count,
//       company: this.selectedDepartment?.label || 'غير محدد',
//       status: 'Active'
//     });

//     this.assetsClient.createAsset(command).pipe(
//       takeUntil(this.destroy$)
//     ).subscribe({
//       next: () => {
//         this.toastService.show('تم إضافة الأصل بنجاح.', 'success');
//         this.router.navigate(['/assets']);
//       },
//       error: (error) => {
//         this.toastService.show('فشل إضافة الأصل. حاول مرة أخرى.', 'error');
//         console.error('Error adding asset:', error);
//       }
//     });
//   }

//   onCancel(): void {
//     this.resetForm();
//     this.toastService.show('تم إلغاء العملية', 'info');
//     this.router.navigate(['/assets']);
//   }

//   private resetForm(): void {
//     this.assetName = '';
//     this.serial = '';
//     this.countryOfManufacture = '';
//     this.yearOfManufacture = null;
//     this.manufacturer = '';
//     this.model = '';
//     this.count = 0;
//     this.initialValue = 0;
//     this.currentValue = 0;
//     this.ownershipRatio = 0;
//     this.date = null;
//     this.itemName = '';
//     this.selectedDepartment = null;
//     this.showSelector = false;
//     this.formTouched = false;
//   }
// }