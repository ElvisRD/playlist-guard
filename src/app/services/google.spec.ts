import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { Google } from './google';
import { Profile } from '../models';

describe('Google service', () => {
  let service: Google;
  let httpMock: HttpTestingController;

  const profile: Profile = {
    email: 'user@example.com',
    name: 'User',
    picture: 'https://example.com/avatar.png',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Google);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushInitialProfile() {
    httpMock.expectOne('/google-auth/profile').flush(profile);
  }

  it('should be created', () => {
    flushInitialProfile();
    expect(service).toBeTruthy();
  });

  it('should load the profile on init in the browser', () => {
    flushInitialProfile();
    expect(service.profile()).toEqual(profile);
    expect(service.loading()).toBe(false);
  });

  it('should clear the profile and finish loading when the request fails', () => {
    httpMock
      .expectOne('/google-auth/profile')
      .flush(null, { status: 500, statusText: 'Server Error' });
    expect(service.profile()).toBeNull();
    expect(service.loading()).toBe(false);
  });

  it('should get the profile via GET', () => {
    flushInitialProfile();
    let result: Profile | undefined;
    service.getProfile().subscribe((res) => (result = res));
    httpMock.expectOne('/google-auth/profile').flush(profile);
    expect(result).toEqual(profile);
  });

  it('should return the auth url', () => {
    flushInitialProfile();
    const response = { url: 'https://accounts.google.com/o/oauth2/auth?...' };
    let result: { url: string } | undefined;
    service.authenticateUser().subscribe((res) => (result = res));
    httpMock.expectOne('/google-auth/auth-url').flush(response);
    expect(result).toEqual(response);
  });

  it('should reject authenticateWithGoogle when the auth url is not from Google', () => {
    flushInitialProfile();
    service.authenticateUser = vi.fn(() =>
      of({ url: 'https://not-google.example/auth' }),
    ) as unknown as Google['authenticateUser'];

    let error: Error | undefined;
    service.authenticateWithGoogle().subscribe({
      error: (err) => (error = err),
    });

    expect(error).toBeDefined();
    expect(error?.message).toBe('Invalid auth URL');
  });

  it('should clear the profile', () => {
    flushInitialProfile();
    expect(service.profile()).toEqual(profile);
    service.cleanProfile();
    expect(service.profile()).toBeNull();
  });

  it('should logout and clear the profile', () => {
    flushInitialProfile();
    service.logout().subscribe();
    httpMock.expectOne('/google-auth/logout').flush({});
    expect(service.profile()).toBeNull();
  });

  it('should clear the profile and emit the error when logout fails', () => {
    flushInitialProfile();
    let result: unknown;
    service.logout().subscribe((res) => (result = res));
    httpMock
      .expectOne('/google-auth/logout')
      .flush(null, { status: 500, statusText: 'Server Error' });

    expect((result as { status?: number }).status).toBe(500);
    expect(service.profile()).toBeNull();
  });
});
