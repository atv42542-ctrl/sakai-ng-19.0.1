import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';
import * as XLSX from 'xlsx';
import { lastValueFrom } from 'rxjs';

export interface ImportConfig {
    expectedHeaders: string[];
    entityName: string;
    getExistingData?: () => any; //Optional
    createEntity?: (entity: any) => any; //Optional
    processData?: (data: any[]) => Promise<void>; // new
    loadDataMethod?: () => void;
}
export interface ImportResult {
    totalCount: number;
    successCount: number;
    failCount: number;
    errors: any[];
    warnings?: any[];
    duration: number;
    timestamp?: Date;
}

@Injectable({ providedIn: 'root' })
export class ExcelImportService {
    constructor(private messageService: MessageService) {}

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
            const file = event.files[0];
            if (!file) throw new Error('لم يتم اختيار ملف');

            const jsonData: any[] = await this.readExcelFile(file, config.expectedHeaders);
            result.totalCount = jsonData.length;
            if (jsonData.length === 0) {
                this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: 'لا توجد بيانات للاستيراد' });
                return result;
            }

            // Check if the data is available in getExistingData
            let existingData: any[] = [];
            if (config.getExistingData) {
                existingData = await lastValueFrom(config.getExistingData());
            }

            // If processData is available, we use it (batch)
            if (config.processData) {
                try {
                    await config.processData(jsonData);
                    result.successCount = result.totalCount;
                } catch (error: any) {
                    result.failCount = result.totalCount;
                    result.errors.push({ message: error?.message || 'فشل في معالجة البيانات' });
                    this.handleError(error, 'فشل في معالجة البيانات');
                }
            }
            // Otherwise we use createEntity for each row
            else if (config.createEntity) {
                const uploadResult = await this.uploadData(jsonData, config.createEntity);
                result.successCount = uploadResult.successCount;
                result.failCount = uploadResult.failCount;
            }

            if (result.successCount > 0) {
                this.messageService.add({ severity: 'success', summary: 'نجاح', detail: `تم استيراد ${result.successCount} من ${result.totalCount} بنجاح` });
            }
            if (result.failCount > 0) {
                this.messageService.add({ severity: 'warn', summary: 'تنبيه', detail: `فشل في استيراد ${result.failCount} عنصر` });
            }

            if (config.loadDataMethod) config.loadDataMethod();
        } catch (error: any) {
            result.failCount = result.totalCount;
            this.handleError(error, 'فشل في عملية الاستيراد');
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
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: expectedHeaders, defval: '' });

                    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
                    if (!headers || !expectedHeaders.every((h, i) => h === headers[i])) {
                        reject(new Error(`ترتيب الأعمدة غير صحيح. يجب أن تكون: ${expectedHeaders.join(', ')}`));
                        return;
                    }

                    resolve(jsonData.slice(1) as any[]); // تجاهل الصف الأول
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
