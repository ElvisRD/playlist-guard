import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Toast } from './toast';
import { Toast as ToastService } from '../../services/toast';
import { ToastText, ToastType } from '../../models';

describe('Toast', () => {
  let component: Toast;
  let fixture: ComponentFixture<Toast>;
  let service: ToastService;
  let httpMock: HttpTestingController;

  const toastTexts: Record<ToastType, ToastText> = {
    success: { text: 'Operación exitosa' },
    error: { text: 'Ocurrió un error' },
    warning: { text: 'Ten cuidado' },
    'not-found': { text: 'No se encontró el recurso' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toast],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Toast);
    component = fixture.componentInstance;
    service = TestBed.inject(ToastService);
    httpMock = TestBed.inject(HttpTestingController);

    fixture.detectChanges();
    const req = httpMock.expectOne('/jsons/toastText.json');
    req.flush(toastTexts);
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render anything when hidden', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('p')).toBeNull();
  });

  it('should show the fallback text from the config when there is no message', () => {
    service.show('error');
    fixture.detectChanges();
    expect(component.visible()).toBe(true);
    expect(component.displayMessage()).toBe('Ocurrió un error');
    service.close();
  });

  it('should prefer the custom message over the config text', () => {
    service.show('warning', 'Mensaje personalizado');
    expect(component.displayMessage()).toBe('Mensaje personalizado');
    service.close();
  });

  it('should return an empty string when there is no message and no config', () => {
    expect(component.displayMessage()).toBe('');
  });

  it('should map toast types to css classes', () => {
    service.show('success');
    expect(component.classes()).toBe('border-green-500/40 bg-green-900/60');

    service.show('error');
    expect(component.classes()).toBe('border-red-500/40 bg-red-900/60');

    service.show('warning');
    expect(component.classes()).toBe('border-yellow-500/40 bg-yellow-900/60');

    service.show('not-found');
    expect(component.classes()).toBe('border-red-500/40 bg-red-900/60');

    service.type.set('weird' as ToastType);
    expect(component.classes()).toBe('border-zinc-700 bg-zinc-800');
    service.close();
  });

  it('should close the toast on close call', () => {
    service.show('error', 'mensaje');
    component.onClose();
    expect(service.visible()).toBe(false);
  });

  it('should render the toast in the DOM when visible', () => {
    service.show('not-found');
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('No se encontró el recurso');
    service.close();
  });
});
