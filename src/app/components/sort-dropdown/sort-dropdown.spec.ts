import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SortDropdown } from './sort-dropdown';

describe('SortDropdown', () => {
  let component: SortDropdown;
  let fixture: ComponentFixture<SortDropdown>;

  const testOptions: Record<string, string> = {
    fecha: 'Fecha',
    ascendente: 'Asc',
    descendente: 'Desc',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortDropdown],
    }).compileComponents();

    fixture = TestBed.createComponent(SortDropdown);
    fixture.componentRef.setInput('options', testOptions);
    fixture.componentRef.setInput('selected', 'fecha');
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have option keys', () => {
    expect(component.optionKeys()).toEqual(['fecha', 'ascendente', 'descendente']);
  });

  it('should toggle dropdown', () => {
    expect(component.isOpen()).toBeFalsy();
    component.toggleDropdown();
    expect(component.isOpen()).toBeTruthy();
    component.toggleDropdown();
    expect(component.isOpen()).toBeFalsy();
  });

  it('should emit selectedChange on select', () => {
    let emitted: string | undefined;
    component.selectedChange.subscribe((v) => (emitted = v));
    component.select('ascendente');
    expect(emitted).toBe('ascendente');
    expect(component.isOpen()).toBeFalsy();
  });
});
