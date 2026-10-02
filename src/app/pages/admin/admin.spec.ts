import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';

import { Admin } from './admin';
import { AdminUsersService } from '../../services/admin/admin-users';
import { Toast } from '../../services/toast/toast';
import { NotificationSubscription } from '../../models';

const sub = (id: string, email: string): NotificationSubscription => ({
  id,
  userId: `user-${id}`,
  email,
  playlistIds: ['PL1'],
  isActive: true,
  status: 'pending',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
});

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;
  let adminMock: {
    getPendingSubscriptions: ReturnType<typeof vi.fn>;
    approveSubscription: ReturnType<typeof vi.fn>;
    rejectSubscription: ReturnType<typeof vi.fn>;
  };
  let toastMock: { show: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    adminMock = {
      getPendingSubscriptions: vi.fn().mockReturnValue(of([sub('1', 'a@b.com')])),
      approveSubscription: vi.fn().mockReturnValue(of({})),
      rejectSubscription: vi.fn().mockReturnValue(of({})),
    };
    toastMock = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Admin],
      providers: [
        { provide: AdminUsersService, useValue: adminMock },
        { provide: Toast, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Admin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads pending subscriptions on init', () => {
    expect(adminMock.getPendingSubscriptions).toHaveBeenCalled();
    expect(component.subscriptions().length).toBe(1);
    expect(component.loading()).toBe(false);
  });

  it('sets error state when loading fails', async () => {
    adminMock.getPendingSubscriptions.mockReturnValue(throwError(() => new Error('500')));
    component.load();
    await fixture.whenStable();
    expect(component.error()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('approves a subscription and removes it from the list', () => {
    component.approve(sub('1', 'a@b.com'));
    expect(adminMock.approveSubscription).toHaveBeenCalledWith('1');
    expect(component.subscriptions()).toEqual([]);
    expect(toastMock.show).toHaveBeenCalledWith('success', 'Suscripción de a@b.com aprobada.');
  });

  it('rejects a subscription and removes it from the list', () => {
    component.reject(sub('1', 'a@b.com'));
    expect(adminMock.rejectSubscription).toHaveBeenCalledWith('1');
    expect(component.subscriptions()).toEqual([]);
    expect(toastMock.show).toHaveBeenCalledWith('success', 'Suscripción de a@b.com rechazada.');
  });

  it('shows an error toast when approve fails', () => {
    adminMock.approveSubscription.mockReturnValue(throwError(() => new Error('500')));
    component.approve(sub('1', 'a@b.com'));
    expect(toastMock.show).toHaveBeenCalledWith('error', 'No se pudo aprobar la suscripción.');
    expect(component.subscriptions().length).toBe(1);
  });

  it('filters subscriptions by email when search is set', () => {
    component.subscriptions.set([sub('1', 'a@b.com'), sub('2', 'xyz@b.com')]);
    component.search.set('xyz');
    expect(component.filtered().map((s) => s.id)).toEqual(['2']);
  });

  it('marks a subscription as processing while the request is pending', async () => {
    const pending = new Subject<NotificationSubscription>();
    adminMock.approveSubscription.mockReturnValue(pending.asObservable());
    component.approve(sub('1', 'a@b.com'));
    expect(component.isProcessing('1')).toBe(true);
    pending.next(sub('1', 'a@b.com'));
    expect(component.isProcessing('1')).toBe(false);
  });
});
