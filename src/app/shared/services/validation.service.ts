export interface ValidationError {
    rowIndex: number;
    field: string;
    message: string;
}

export interface ValidationRule {
    field: string; // اسم العمود/الخاصية
    required?: boolean; // هل الحقل إجباري
    unique?: boolean; // هل يجب أن يكون فريد
    type?: 'string' | 'number' | 'boolean'; // نوع البيانات
    relationField?: string; // لو يعتمد على علاقة (مثل parentId موجود)
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ValidationService {
    validateAll(data: any[], existingData: any[], rules: ValidationRule[]): ValidationResult {
        const errors: ValidationError[] = [];

        data.forEach((row, index) => {
            rules.forEach((rule) => {
                const value = row[rule.field];

                // Required check
                if (rule.required && (value === undefined || value === null || value.toString().trim() === '')) {
                    errors.push({ rowIndex: index + 2, field: rule.field, message: `${rule.field} is required` });
                }

                // Type check
                if (rule.type && value) {
                    if (rule.type === 'number' && isNaN(Number(value))) {
                        errors.push({ rowIndex: index + 2, field: rule.field, message: `${rule.field} must be a number` });
                    }
                    if (rule.type === 'boolean' && !['true', 'false', '1', '0'].includes(value.toString().toLowerCase())) {
                        errors.push({ rowIndex: index + 2, field: rule.field, message: `${rule.field} must be true/false` });
                    }
                }

                // Unique check
                if (rule.unique && value) {
                    const duplicateInNew = data.filter((x, i) => i !== index && x[rule.field] === value).length > 0;
                    const duplicateInExisting = existingData.some((x) => x[rule.field] === value);

                    if (duplicateInNew || duplicateInExisting) {
                        errors.push({ rowIndex: index + 2, field: rule.field, message: `${rule.field} must be unique` });
                    }
                }

                // Relation check
                if (rule.relationField && value) {
                    const relationExists = existingData.some((x) => x[rule.relationField!] === value);
                    if (!relationExists) {
                        errors.push({
                            rowIndex: index + 2,
                            field: rule.field,
                            message: `Invalid ${rule.field}, related ${rule.relationField} not found`
                        });
                    }
                }
            });
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}
