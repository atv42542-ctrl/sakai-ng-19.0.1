import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditAssetCategoriesComponent } from './edit-asset-categories.component';
import { AssetCategoriesService } from '../../Service/asset-categories.service';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

describe('EditAssetCategoriesComponent', () => {
  let component: EditAssetCategoriesComponent;
  let fixture: ComponentFixture<EditAssetCategoriesComponent>;
  let mockService: any;

  beforeEach(async () => {
    mockService = { updateAssetCategory: () => of({}) };
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      declarations: [EditAssetCategoriesComponent],
      providers: [{ provide: AssetCategoriesService, useValue: mockService }]
    }).compileComponents();
    fixture = TestBed.createComponent(EditAssetCategoriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
