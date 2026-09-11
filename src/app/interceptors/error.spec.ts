import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
  HttpClient,
  withInterceptors,
  HttpErrorResponse,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { errorInterceptor } from './error';
import { Dialog } from '../services/dialog';
import { Toast } from '../services/toast';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let dialogMock: { open: ReturnType<typeof vi.fn> };
  let toastMock: { show: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    dialogMock = { open: vi.fn() };
    toastMock = { show: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: Dialog, useValue: dialogMock as unknown as Dialog },
        { provide: Toast, useValue: toastMock as unknown as Toast },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function failRequest(url: string, status: number): HttpErrorResponse {
    let error: HttpErrorResponse | undefined;
    http.get(url).subscribe({ error: (err) => (error = err) });
    httpMock.expectOne(url).flush(null, { status, statusText: 'Error' });
    expect(error).toBeDefined();
    return error!;
  }

  it('should open the unauthorized dialog on 401', () => {
    failRequest('/youtube/playlist/save/PL1', 401);
    expect(dialogMock.open).toHaveBeenCalledWith('unauthorized');
    expect(toastMock.show).not.toHaveBeenCalled();
  });

  it('should show a not-found toast on 404', () => {
    failRequest('/youtube/playlists', 404);
    expect(toastMock.show).toHaveBeenCalledWith('not-found');
    expect(dialogMock.open).not.toHaveBeenCalled();
  });

  it('should show an error toast on any other status', () => {
    failRequest('/youtube/playlist/PL1', 500);
    expect(toastMock.show).toHaveBeenCalledWith('error');
    expect(dialogMock.open).not.toHaveBeenCalled();
  });

  it('should rethrow the error so the caller receives it', () => {
    const error = failRequest('/youtube/playlist/PL1', 500);
    expect(error.status).toBe(500);
  });

  it('should not show dialogs or toasts for auth-url requests', () => {
    failRequest('/google-auth/auth-url', 404);
    expect(dialogMock.open).not.toHaveBeenCalled();
    expect(toastMock.show).not.toHaveBeenCalled();
  });

  it('should not show dialogs or toasts for json requests', () => {
    failRequest('/jsons/toastText.json', 404);
    expect(dialogMock.open).not.toHaveBeenCalled();
    expect(toastMock.show).not.toHaveBeenCalled();
  });

  it('should not show dialogs or toasts for profile requests', () => {
    failRequest('/google-auth/profile', 401);
    expect(dialogMock.open).not.toHaveBeenCalled();
    expect(toastMock.show).not.toHaveBeenCalled();
  });
});
