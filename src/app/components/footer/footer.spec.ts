import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { Footer } from './footer';
import { Google } from '../../services/google';
import { Profile } from '../../models';

describe('Footer', () => {
  let component: Footer;
  let fixture: ComponentFixture<Footer>;

  const googleMock = {
    profile: signal<Profile | null>(null),
  } as unknown as Google;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Footer],
      providers: [provideRouter([]), { provide: Google, useValue: googleMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Footer);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the brand', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('PlaylistGuard');
  });

  it('should render the privacy and terms links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Privacidad');
    expect(compiled.textContent).toContain('Términos');
  });

  it('should show a Home link when the user is not logged in', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Home');
  });

  it('should hide the Home link when the user is logged in', () => {
    googleMock.profile.set({
      email: 'a@example.com',
      name: 'User',
      picture: 'https://example.com/a.png',
    });
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).not.toContain('Home');
  });
});
