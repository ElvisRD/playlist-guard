import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Playlists } from './playlists';

describe('Playlists', () => {
  let component: Playlists;
  let fixture: ComponentFixture<Playlists>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Playlists],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Playlists);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
