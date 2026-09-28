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

  it('should display all sort options', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Fecha');
    expect(compiled.textContent).toContain('Asc');
    expect(compiled.textContent).toContain('Desc');
  });

  it('should highlight selected option', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const selectedOption = compiled.querySelector('.bg-custom-purple') as HTMLElement;
    expect(selectedOption).toBeTruthy();
  });

  it('should emit selectedChange on option click', () => {
    let emitted: string | undefined;
    component.selectedChange.subscribe((v) => (emitted = v));
    component.isOpen.set(true);
    fixture.detectChanges();

    const options = fixture.nativeElement.querySelectorAll('button');
    const ascOption = Array.from(options).find((btn) =>
      (btn as HTMLButtonElement).textContent?.includes('Asc'),
    ) as HTMLButtonElement;
    ascOption.click();
    fixture.detectChanges();

    expect(emitted).toBe('ascendente');
  });

  it('should show dropdown options when open', () => {
    component.isOpen.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Fecha');
    expect(compiled.textContent).toContain('Asc');
    expect(compiled.textContent).toContain('Desc');
  });

  it('should hide dropdown options when closed', () => {
    component.isOpen.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const dropdown = compiled.querySelector('.absolute') as HTMLElement;
    expect(dropdown).toBeFalsy();
  });

  it('should update selected value', () => {
    component.select('ascendente');
    expect(component.selected()).toBe('ascendente');
  });

  it('should close dropdown after selection', () => {
    component.isOpen.set(true);
    component.select('descendente');
    expect(component.isOpen()).toBe(false);
  });

  it('should show arrow icon', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.pi-chevron-down')).toBeTruthy();
  });

  it('should toggle dropdown on button click', () => {
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(component.isOpen()).toBe(false);
    button.click();
    expect(component.isOpen()).toBe(true);
    button.click();
    expect(component.isOpen()).toBe(false);
  });
});
