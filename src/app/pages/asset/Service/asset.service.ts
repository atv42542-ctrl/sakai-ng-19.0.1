import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AssetService {
    constructor(private http: HttpClient) {}

    logOperation(assetName: string, operation: string, info: string, user: string, now: string): Observable<any> {
        const payload = {
            doctype: 'Asset Operations',
            asset: assetName,
            operation,
            originNumber: '', // Add origin number if available
            currentValue: '', // Add current value if available
            date: new Date().toISOString().split('T')[0],
            operationInfo: info,
            operationExecutor: user,
            operationStatus: 'في انتظار الموافقة على عملية',
            operationNumber: `OPR-${now}`
        };
        return this.http.post('/api/resource/AssetOperations', payload);
    }

    createOperation(assetName: string, operation: string, reason: string, user: string): Observable<any> {
        const payload = {
            doctype: 'Asset Operations',
            asset: assetName,
            operation,
            originNumber: '', // Add origin number if available
            currentValue: '', // Add current value if available
            date: new Date().toISOString().split('T')[0],
            operationInfo: reason,
            operationExecutor: user,
            operationStatus: 'في انتظار الموافقة على عملية',
            operationNumber: `OPR-${new Date().toISOString()}`
        };
        return this.http.post('/api/resource/AssetOperations', payload);
    }

    updateAssetStatus(assetName: string, status: string): Observable<any> {
        return this.http.put(`/api/resource/CustomAsset/${assetName}`, { assetStatus: status });
    }
}
