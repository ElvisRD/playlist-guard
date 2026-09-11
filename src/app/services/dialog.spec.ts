import { TestBed } from '@angular/core/testing';
import { Dialog } from './dialog';

describe('Dialog service', () => {
  let service: Dialog;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Dialog);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start closed with empty type and null playlist', () => {
    expect(service.visible()).toBe(false);
    expect(service.type()).toBe('');
    expect(service.playlist()).toBeNull();
  });

  it('should open with type and playlist id', () => {
    service.open('delete-playlist', 'PL123');
    expect(service.visible()).toBe(true);
    expect(service.type()).toBe('delete-playlist');
    expect(service.playlist()).toBe('PL123');
  });

  it('should set playlist to null when opened without id', () => {
    service.open('unauthorized');
    expect(service.visible()).toBe(true);
    expect(service.playlist()).toBeNull();
  });

  it('should close and reset its state', () => {
    service.open('delete-playlist', 'PL123');
    service.close();
    expect(service.visible()).toBe(false);
    expect(service.playlist()).toBeNull();
    expect(service.type()).toBe('delete-playlist');
  });

  it('should reset type on next open', () => {
    service.open('logout');
    expect(service.type()).toBe('logout');
    service.open('unauthorized');
    expect(service.type()).toBe('unauthorized');
  });

  it('should invoke the save callback and close on save', () => {
    const onSave = vi.fn();
    service.open('delete-playlist', 'PL123', onSave);
    service.save();
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(service.visible()).toBe(false);
    expect(service.playlist()).toBeNull();
  });

  it('should close without invoking a callback when none was provided', () => {
    service.open('unauthorized');
    service.save();
    expect(service.visible()).toBe(false);
  });

  it('should not invoke a stale callback after close', () => {
    const onSave = vi.fn();
    service.open('delete-playlist', 'PL123', onSave);
    service.close();
    service.open('logout');
    service.save();
    expect(onSave).not.toHaveBeenCalled();
  });
});
