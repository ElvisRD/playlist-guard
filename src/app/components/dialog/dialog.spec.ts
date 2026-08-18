import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Dialog } from './dialog';

describe('Dialog', () => {
  let component: Dialog;
  let fixture: ComponentFixture<Dialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dialog],
      providers: [provideHttpClient(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Dialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
