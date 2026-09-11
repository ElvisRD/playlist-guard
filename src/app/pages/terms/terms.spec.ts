import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Terms } from './terms';

describe('Terms', () => {
  let component: Terms;
  let fixture: ComponentFixture<Terms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Terms],
    }).compileComponents();

    fixture = TestBed.createComponent(Terms);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the terms of service content', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Términos del Servicio');
    expect(compiled.textContent).toContain('Aceptación de los términos');
    expect(compiled.textContent).toContain('Limitación de responsabilidad');
  });
});
