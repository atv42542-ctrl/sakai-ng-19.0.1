import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssetCategoriesManagementComponent } from './asset-categories-management.component';
import { AssetCategoriesService } from '../../Service/asset-categories.service';
import { of } from 'rxjs';

describe('AssetCategoriesManagementComponent', () => {
  let component: AssetCategoriesManagementComponent;
  let fixture: ComponentFixture<AssetCategoriesManagementComponent>;
  let mockService: any;

  beforeEach(async () => {
    mockService = { getAllAssetCategories: () => of([]) };
    await TestBed.configureTestingModule({
      declarations: [AssetCategoriesManagementComponent],
      providers: [{ provide: AssetCategoriesService, useValue: mockService }]
    }).compileComponents();
    fixture = TestBed.createComponent(AssetCategoriesManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
