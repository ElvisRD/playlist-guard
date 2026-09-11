import { TestBed } from '@angular/core/testing';
import { provideHttpClient, HttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { credentialsInterceptor } from './credentials';

describe('credentialsInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([credentialsInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should set withCredentials on GET requests', () => {
    http.get('/api/test').subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should set withCredentials on POST requests', () => {
    http.post('/api/test', { data: 1 }).subscribe();
    const req = httpMock.expectOne('/api/test');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });

  it('should set withCredentials on DELETE requests', () => {
    http.delete('/api/test/1').subscribe();
    const req = httpMock.expectOne('/api/test/1');
    expect(req.request.withCredentials).toBe(true);
    req.flush({});
  });
});
