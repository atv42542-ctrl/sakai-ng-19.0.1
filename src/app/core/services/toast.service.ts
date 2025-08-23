import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ToastService {
    constructor(private messageService: MessageService) {}

    /**
     * Display a Toast message to the user.
     * @param message Message text
     * @param severity Message type: Success, Information, Warning, or Error
     * @param life Message lifetime in milliseconds (default: 3000)
     */
    show(message: string, severity: 'success' | 'info' | 'warn' | 'error' = 'info', life: number = 3000): void {
        this.messageService.add({
            severity,
            summary: severity.charAt(0).toUpperCase() + severity.slice(1),
            detail: message,
            life
        });
    }

    /**
     * Clear all toast messages
     */
    clear(): void {
        this.messageService.clear();
    }

    /**
     * Process the server response and display an appropriate error message to the user
     * @param error The error object from the server
     */
    showServerError(error: any): void {
        console.log('Error:', error); // For debugging
        console.log('Error Result:', error?.result); // Validate the content of the result

        const serverMessage = (() => {
            // Validate the SwaggerException object
            const errorData = error?.result || (error?.response ? JSON.parse(error.response) : null);

            // Validate the presence of validation errors
            if (errorData?.errors && typeof errorData.errors === 'object') {
                const validationMessages = Object.values(errorData.errors).flat().filter(Boolean).join('\n');
                return validationMessages;
            }

            // Validate the presence of an InnerMessage
            if (errorData?.InnerMessage) {
                return errorData.InnerMessage;
            }

            // Validate the presence of a detail
            if (errorData?.detail) {
                return errorData.detail;
            }

            // Default message
            return typeof error?.message === 'string' ? error.message : 'An error occurred. Please try again.';
        })();

        this.show(serverMessage, 'error');
    }
}
