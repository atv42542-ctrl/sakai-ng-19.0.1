import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddAssetCategoriesComponent } from './add-asset-categories.component';
import { AssetCategoriesService } from '../../Service/asset-categories.service';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

describe('AddAssetCategoriesComponent', () => {
  let component: AddAssetCategoriesComponent;
  let fixture: ComponentFixture<AddAssetCategoriesComponent>;
  let mockService: any;

  beforeEach(async () => {
    mockService = { addAssetCategory: () => of(''), updateAssetCategory: () => of({}) };
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [AddAssetCategoriesComponent],
      providers: [{ provide: AssetCategoriesService, useValue: mockService }]
    }).compileComponents();
    fixture = TestBed.createComponent(AddAssetCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
