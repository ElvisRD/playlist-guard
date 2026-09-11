import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Privacy } from './privacy';

describe('Privacy', () => {
  let component: Privacy;
  let fixture: ComponentFixture<Privacy>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Privacy],
    }).compileComponents();

    fixture = TestBed.createComponent(Privacy);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the privacy policy content', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Política de Privacidad');
    expect(compiled.textContent).toContain('Datos de tu cuenta de Google');
    expect(compiled.textContent).toContain('Contacto');
  });
});
