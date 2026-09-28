import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Toast } from './toast';
import { Toast as ToastService } from '../../services/toast';
import { signal } from '@angular/core';
import type { ToastType } from '../../models';

describe('Toast Component', () => {
  let component: Toast;
  let fixture: ComponentFixture<Toast>;

  const toastServiceMock = {
    visible: signal(false),
    type: signal<ToastType | null>(null),
    message: signal(''),
    show: vi.fn(),
    close: vi.fn(),
  } as unknown as ToastService & { type: { set: (v: ToastType | null) => void } };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Toast],
      providers: [
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Toast);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display message from service', () => {
    toastServiceMock.message.set('Test message');
    fixture.detectChanges();
    expect(component.message()).toBe('Test message');
  });

  it('should show toast when service triggers', () => {
    toastServiceMock.visible.set(true);
    toastServiceMock.type.set('success');
    toastServiceMock.message.set('Success!');
    fixture.detectChanges();

    expect(component.visible()).toBe(true);
    expect(component.type()).toBe('success');
  });

  it('should return correct display message', () => {
    toastServiceMock.message.set('Hello World');
    expect(component.displayMessage()).toBe('Hello World');
  });

  it('should return empty string when no message', () => {
    toastServiceMock.message.set('');
    expect(component.displayMessage()).toBe('');
  });

  it('should apply success classes', () => {
    toastServiceMock.type.set('success');
    expect(component.classes()).toContain('green');
  });

  it('should apply error classes', () => {
    toastServiceMock.type.set('error');
    expect(component.classes()).toContain('red');
  });

  it('should apply warning classes', () => {
    toastServiceMock.type.set('warning');
    expect(component.classes()).toContain('yellow');
  });

  it('should apply default classes for unknown type', () => {
    toastServiceMock.type.set(null);
    expect(component.classes()).toContain('zinc');
  });

  it('should call service close on close', () => {
    component.onClose();
    expect(toastServiceMock.close).toHaveBeenCalled();
  });

  it('should set the toast config from the loaded texts for the current type', () => {
    toastServiceMock.type.set('success');
    fixture.detectChanges();

    const httpMock = TestBed.inject(HttpTestingController);
    const req = httpMock.expectOne('/jsons/toastText.json');
    req.flush({
      success: { text: 'Acción exitosa' },
      error: { text: 'Error al guardar' },
    });

    expect(component.toastConfig()).toEqual({ text: 'Acción exitosa' });
    httpMock.verify();
  });

  it('should fall back to the loaded text when there is no direct message', () => {
    toastServiceMock.type.set('success');
    toastServiceMock.message.set('');
    fixture.detectChanges();

    const httpMock = TestBed.inject(HttpTestingController);
    const req = httpMock.expectOne('/jsons/toastText.json');
    req.flush({
      success: { text: 'Acción exitosa' },
    });

    expect(component.displayMessage()).toBe('Acción exitosa');
    httpMock.verify();
  });

  it('should show success toast with correct styling', () => {
    toastServiceMock.visible.set(true);
    toastServiceMock.type.set('success');
    toastServiceMock.message.set('Success!');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Success!');
    expect(compiled.querySelector('.green')).toBeTruthy();
  });

  it('should show error toast with correct styling', () => {
    toastServiceMock.visible.set(true);
    toastServiceMock.type.set('error');
    toastServiceMock.message.set('Error!');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Error!');
    expect(compiled.querySelector('.red')).toBeTruthy();
  });

  it('should show warning toast with correct styling', () => {
    toastServiceMock.visible.set(true);
    toastServiceMock.type.set('warning');
    toastServiceMock.message.set('Warning!');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Warning!');
    expect(compiled.querySelector('.yellow')).toBeTruthy();
  });

  it('should show toast with icon', () => {
    toastServiceMock.visible.set(true);
    toastServiceMock.type.set('success');
    toastServiceMock.message.set('Success!');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.pi-check-circle')).toBeTruthy();
  });

  it('should show close button', () => {
    toastServiceMock.visible.set(true);
    toastServiceMock.type.set('success');
    toastServiceMock.message.set('Success!');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.pi-times')).toBeTruthy();
  });

  it('should close toast on close button click', () => {
    toastServiceMock.visible.set(true);
    toastServiceMock.type.set('success');
    toastServiceMock.message.set('Success!');
    fixture.detectChanges();

    const closeButton = fixture.nativeElement.querySelector('.pi-times') as HTMLElement;
    closeButton.click();
    fixture.detectChanges();

    expect(toastServiceMock.close).toHaveBeenCalled();
  });

  it('should show toast container when visible', () => {
    toastServiceMock.visible.set(true);
    toastServiceMock.type.set('success');
    toastServiceMock.message.set('Success!');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.fixed')).toBeTruthy();
  });

  it('should hide toast container when not visible', () => {
    toastServiceMock.visible.set(false);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.fixed')).toBeFalsy();
  });

  it('should show toast message', () => {
    toastServiceMock.visible.set(true);
    toastServiceMock.type.set('success');
    toastServiceMock.message.set('Test message');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Test message');
  });

  it('should apply correct classes for success type', () => {
    toastServiceMock.type.set('success');
    const classes = component.classes();
    expect(classes).toContain('green');
    expect(classes).toContain('border-green-500');
  });

  it('should apply correct classes for error type', () => {
    toastServiceMock.type.set('error');
    const classes = component.classes();
    expect(classes).toContain('red');
    expect(classes).toContain('border-red-500');
  });

  it('should apply correct classes for warning type', () => {
    toastServiceMock.type.set('warning');
    const classes = component.classes();
    expect(classes).toContain('yellow');
    expect(classes).toContain('border-yellow-500');
  });

  it('should apply default classes for unknown type', () => {
    toastServiceMock.type.set(null);
    const classes = component.classes();
    expect(classes).toContain('zinc');
  });

  it('should show toast with animation', () => {
    toastServiceMock.visible.set(true);
    toastServiceMock.type.set('success');
    toastServiceMock.message.set('Success!');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.animate-fade-in')).toBeTruthy();
  });

  it('should show toast with slide animation', () => {
    toastServiceMock.visible.set(true);
    toastServiceMock.type.set('success');
    toastServiceMock.message.set('Success!');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.animate-slide-up')).toBeTruthy();
  });
});
