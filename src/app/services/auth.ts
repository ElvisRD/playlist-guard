import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface User {
  sub: string;
  email: string;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly TOKEN_KEY = 'playlist_guard_token';
  private token = signal<string | null>(null);
  private platformId = inject(PLATFORM_ID);

  user = computed<User | null>(() => {
    const t = this.token();
    if (!t) return null;
    try {
      const payload = JSON.parse(atob(t.split('.')[1]));
      return { sub: payload.sub, email: payload.email, name: payload.name };
    } catch {
      return null;
    }
  });

  isLoggedIn = computed(() => this.token() !== null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const saved = localStorage.getItem(this.TOKEN_KEY);
      if (saved) this.token.set(saved);
    }
  }

  login(token: string) {
    console.log(token)
    this.token.set(token);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.TOKEN_KEY, token);
    }
  }

  logout() {
    this.token.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
    }
  }

  getToken(): string | null {
    return this.token();
  }
}
