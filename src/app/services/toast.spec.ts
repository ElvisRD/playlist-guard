import { TestBed } from '@angular/core/testing';
import { Toast } from './toast';

describe('Toast service', () => {
  let service: Toast;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Toast);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start hidden with empty state', () => {
    expect(service.visible()).toBe(false);
    expect(service.type()).toBe('');
    expect(service.message()).toBe('');
  });

  it('should show a toast with type and message', () => {
    service.show('success', 'Listo');
    expect(service.visible()).toBe(true);
    expect(service.type()).toBe('success');
    expect(service.message()).toBe('Listo');
  });

  it('should show a toast with empty message when none is provided', () => {
    service.show('error');
    expect(service.visible()).toBe(true);
    expect(service.message()).toBe('');
  });

  it('should auto-close after 5 seconds', () => {
    service.show('warning', 'Cuidado');
    expect(service.visible()).toBe(true);
    vi.advanceTimersByTime(4999);
    expect(service.visible()).toBe(true);
    vi.advanceTimersByTime(1);
    expect(service.visible()).toBe(false);
  });

  it('should close immediately and cancel the pending timeout', () => {
    service.show('error', 'Oops');
    service.close();
    expect(service.visible()).toBe(false);
    vi.advanceTimersByTime(6000);
    expect(service.visible()).toBe(false);
  });

  it('should reset the timer when shown again', () => {
    service.show('success', 'Primero');
    vi.advanceTimersByTime(3000);
    service.show('success', 'Segundo');
    vi.advanceTimersByTime(3000);
    expect(service.visible()).toBe(true);
    vi.advanceTimersByTime(2000);
    expect(service.visible()).toBe(false);
  });
});
