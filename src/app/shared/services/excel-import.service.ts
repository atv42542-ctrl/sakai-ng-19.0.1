import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

// PrimeNG
import { MessageService } from 'primeng/api';

// XLSX
import * as XLSX from 'xlsx';

// Custom
import { ValidationService, ValidationError } from './validation.service';

export interface ImportConfig {
    expectedHeaders: string[];
    entityName: string;
    getExistingData: () => any;
    createEntity: (entity: any) => any;
    loadDataMethod?: () => void;
}

export interface ImportResult {
    totalCount: number;
    successCount: number;
    failCount: number;
    errors: ValidationError[];
    warnings?: any[];
    duration: number;
    timestamp?: Date;
}

@Injectable({ providedIn: 'root' })
export class ExcelImportService {
    constructor(
        private validationService: ValidationService,
        private messageService: MessageService
    ) {}

    async importExcel(event: any, config: ImportConfig): Promise<ImportResult> {
        const result: ImportResult = {
            totalCount: 0,
            successCount: 0,
            failCount: 0,
            errors: [],
            duration: 0,
            timestamp: new Date()
        };

        const startTime = Date.now();

        try {
            // 1. Read file
            const file = event.files?.[0];
            if (!file) throw new Error('لم يتم اختيار ملف');

            // 2. Convert Excel to JSON
            const jsonData: any[] = await this.readExcelFile(file, config.expectedHeaders);
            result.totalCount = jsonData.length;

            if (jsonData.length === 0) {
                this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: 'لا توجد بيانات للاستيراد' });
                return result;
            }

            // 3. Get existing data
            const existingData: any[] = await lastValueFrom(config.getExistingData());

            // 4. Validation
            const validationResult = this.validationService.validateAll(jsonData, existingData, []);

            if (!validationResult.isValid) {
                validationResult.errors.forEach((error) => {
                    this.messageService.add({ severity: 'error', summary: 'خطأ في التحقق', detail: error.message, life: 7000 });
                });
                result.failCount = result.totalCount;
                result.errors = validationResult.errors;
                return result;
            }

            // 5. Upload data
            const uploadResult = await this.uploadData(jsonData, config.createEntity);
            result.successCount = uploadResult.successCount;
            result.failCount = uploadResult.failCount;

            // 6. Show result
            if (result.successCount > 0) {
                this.messageService.add({ severity: 'success', summary: 'نجاح', detail: `تم استيراد ${result.successCount} من ${result.totalCount} بنجاح` });
            }
            if (result.failCount > 0) {
                this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: `فشل في استيراد ${result.failCount} عنصر` });
            }

            if (config.loadDataMethod) config.loadDataMethod();
        } catch (error: any) {
            this.handleError(error, 'فشل في عملية الاستيراد');
            result.failCount = result.totalCount;
        } finally {
            result.duration = Date.now() - startTime;
        }

        return result;
    }

    private async readExcelFile(file: File, expectedHeaders: string[]): Promise<any[]> {
        return new Promise<any[]>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];

                    if (!headers || headers.length < expectedHeaders.length || !expectedHeaders.every((h, i) => h === headers[i])) {
                        reject(new Error(`ترتيب الأعمدة غير صحيح. يجب أن تكون: ${expectedHeaders.join(', ')}`));
                        return;
                    }

                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: expectedHeaders, defval: '' });
                    resolve(jsonData.slice(1) as any[]);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = (err) => reject(err);
            reader.readAsArrayBuffer(file);
        });
    }

    private async uploadData(data: any[], createEntity: (entity: any) => any): Promise<{ successCount: number; failCount: number }> {
        let successCount = 0;
        let failCount = 0;

        for (const entity of data) {
            try {
                await lastValueFrom(createEntity(entity));
                successCount++;
            } catch (error) {
                failCount++;
                console.error('فشل في ترحيل البيانات:', error);
            }
        }

        return { successCount, failCount };
    }

    private handleError(error: any, fallbackMessage: string) {
        this.messageService.add({ severity: 'error', summary: 'خطأ', detail: error?.message || fallbackMessage });
    }
}
