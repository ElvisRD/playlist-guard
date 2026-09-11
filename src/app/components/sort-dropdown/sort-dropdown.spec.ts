import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SortDropdown } from './sort-dropdown';

describe('SortDropdown', () => {
  let component: SortDropdown;
  let fixture: ComponentFixture<SortDropdown>;

  const options: Record<string, string> = {
    fecha: 'Fecha',
    ascendente: 'Asc',
    descendente: 'Desc',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortDropdown],
    }).compileComponents();

    fixture = TestBed.createComponent(SortDropdown);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('options', options);
    fixture.componentRef.setInput('selected', 'fecha');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have option keys', () => {
    expect(component.optionKeys()).toEqual(['fecha', 'ascendente', 'descendente']);
  });

  it('should render the selected label', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Fecha');
  });

  it('should toggle the dropdown with the button', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const button = compiled.querySelector<HTMLButtonElement>('button');
    expect(component.isOpen()).toBe(false);
    button?.click();
    expect(component.isOpen()).toBe(true);
    button?.click();
    expect(component.isOpen()).toBe(false);
  });

  it('should emit the selected value and close the dropdown', () => {
    let emitted: string | undefined;
    component.selectedChange.subscribe((v) => (emitted = v));
    component.select('descendente');
    expect(emitted).toBe('descendente');
    expect(component.isOpen()).toBe(false);
  });
});
