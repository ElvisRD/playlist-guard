import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Google, GOOGLE_CLIENT_ID } from './google';
import { Profile } from '../models';

type CodeClientCallback = (response: { code?: string; error?: string }) => void;
type ErrorCallback = (response: { type: string }) => void;

const clientId = 'test-client-id.apps.googleusercontent.com';

const profile: Profile = {
  email: 'user@example.com',
  name: 'User',
  picture: 'https://example.com/avatar.png',
};

function stubGoogleOAuth() {
  let callback: CodeClientCallback = () => undefined;
  let errorCallback: ErrorCallback = () => undefined;
  const requestCode = vi.fn(() => undefined);
  const initCodeClient = vi.fn((config: {
    callback: CodeClientCallback;
    error_callback: ErrorCallback;
  }) => {
    callback = config.callback;
    errorCallback = config.error_callback;
    return { requestCode };
  });

  vi.stubGlobal('google', { accounts: { oauth2: { initCodeClient } } });

  return {
    getCallbacks: () => ({ callback, errorCallback }),
    initCodeClient,
    requestCode,
  };
}

describe('Google service', () => {
  let service: Google;
  let httpMock: HttpTestingController;

  function configure(providers: unknown[] = []) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: GOOGLE_CLIENT_ID, useValue: clientId },
        ...providers,
      ],
    });
    service = TestBed.inject(Google);
    httpMock = TestBed.inject(HttpTestingController);
  }

  function flushInitialProfile() {
    httpMock.expectOne('/google-auth/profile').flush(profile);
  }

  afterEach(() => {
    httpMock?.verify();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('profile management', () => {
    beforeEach(() => configure());

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

  describe('authenticateWithGoogle', () => {
    beforeEach(() => configure());

    it('should authenticate with the code returned by the Google popup', async () => {
      flushInitialProfile();
      const { getCallbacks, initCodeClient, requestCode } = stubGoogleOAuth();

      let result: Profile | undefined;
      service.authenticateWithGoogle().subscribe((res) => (result = res));
      await Promise.resolve();

      expect(initCodeClient).toHaveBeenCalledWith(
        expect.objectContaining({
          client_id: clientId,
          scope: 'openid email profile',
          ux_mode: 'popup',
        }),
      );
      expect(requestCode).toHaveBeenCalledTimes(1);

      getCallbacks().callback({ code: 'authorization-code' });

      httpMock.expectOne('/google-auth/code').flush({});
      httpMock.expectOne('/google-auth/profile').flush(profile);

      expect(result).toEqual(profile);
      expect(service.profile()).toEqual(profile);
    });

    it('should propagate the error when the code exchange fails', async () => {
      flushInitialProfile();
      const { getCallbacks } = stubGoogleOAuth();

      let error: { status?: number } | undefined;
      service.authenticateWithGoogle().subscribe({ error: (err) => (error = err) });
      await Promise.resolve();

      getCallbacks().callback({ code: 'invalid-code' });
      httpMock
        .expectOne('/google-auth/code')
        .flush(null, { status: 500, statusText: 'Server Error' });

      expect(error?.status).toBe(500);
    });

    it('should propagate the error when loading the profile fails after the code exchange', async () => {
      flushInitialProfile();
      const { getCallbacks } = stubGoogleOAuth();

      let error: { status?: number } | undefined;
      service.authenticateWithGoogle().subscribe({ error: (err) => (error = err) });
      await Promise.resolve();

      getCallbacks().callback({ code: 'authorization-code' });
      httpMock.expectOne('/google-auth/code').flush({});
      httpMock
        .expectOne('/google-auth/profile')
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(error?.status).toBe(401);
    });

    it('should propagate an error when Google returns an error code', async () => {
      flushInitialProfile();
      const { getCallbacks } = stubGoogleOAuth();

      let error: Error | undefined;
      service.authenticateWithGoogle().subscribe({ error: (err) => (error = err) });
      await Promise.resolve();

      getCallbacks().callback({ error: 'access_denied' });

      expect(error?.message).toBe('Google auth error: access_denied');
    });

    it('should propagate an error when the popup is closed', async () => {
      flushInitialProfile();
      const { getCallbacks } = stubGoogleOAuth();

      let error: Error | undefined;
      service.authenticateWithGoogle().subscribe({ error: (err) => (error = err) });
      await Promise.resolve();

      getCallbacks().errorCallback({ type: 'popup_closed' });

      expect(error?.message).toBe('Google sign-in popup was closed');
    });
  });

  describe('GIS script loading', () => {
    beforeEach(() => configure());

    it('should inject the GIS script when google is not present yet', async () => {
      flushInitialProfile();
      const appendSpy = vi.spyOn(document.head, 'appendChild');

      service.authenticateWithGoogle().subscribe();
      await Promise.resolve();

      const injected = appendSpy.mock.calls[0]?.[0] as HTMLScriptElement | undefined;
      expect(injected?.src).toBe('https://accounts.google.com/gsi/client');
      expect(injected?.async).toBe(true);
      expect(injected?.defer).toBe(true);
    });

    it('should propagate an error when the GIS script fails to load', async () => {
      flushInitialProfile();
      let onload: () => void = () => undefined;
      let onerror: (event: Event) => void = () => undefined;
      const fakeScript = {
        setAttribute: vi.fn(),
        src: '',
        async: false,
        defer: false,
        set onload(fn: (() => void) | null) {
          onload = fn ?? (() => undefined);
        },
        get onload() {
          return onload;
        },
        set onerror(fn: ((event: Event) => void) | null) {
          onerror = fn ?? (() => undefined);
        },
        get onerror() {
          return onerror;
        },
      } as unknown as HTMLElement;

      vi.spyOn(document, 'createElement').mockImplementation(() => fakeScript);
      vi.spyOn(document.head, 'appendChild').mockImplementation(() => fakeScript);

      let error: Error | undefined;
      service.authenticateWithGoogle().subscribe({ error: (err) => (error = err) });
      await Promise.resolve();

      onerror?.(new Event('error'));
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(error?.message).toBe('No se pudo cargar Google Identity Services');
    });
  });

  describe('Google service on the server', () => {
    it('should reject authenticateWithGoogle when not running in a browser', () => {
      configure([{ provide: PLATFORM_ID, useValue: 'server' }]);

      let error: Error | undefined;
      service.authenticateWithGoogle().subscribe({ error: (err) => (error = err) });

      expect(error?.message).toBe('Google sign-in requires a browser');
    });
  });

  describe('Google service without a client id', () => {
    it('should reject authenticateWithGoogle when GOOGLE_CLIENT_ID is not configured', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting()],
      });
      service = TestBed.inject(Google);
      httpMock = TestBed.inject(HttpTestingController);
      httpMock.expectOne('/google-auth/profile').flush(profile);

      let error: Error | undefined;
      service.authenticateWithGoogle().subscribe({ error: (err) => (error = err) });

      expect(error?.message).toBe('GOOGLE_CLIENT_ID is not configured');
    });
  });
});
