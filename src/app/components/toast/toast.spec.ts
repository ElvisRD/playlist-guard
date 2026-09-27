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
});
