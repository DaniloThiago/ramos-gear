import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { defaultBranding, defaultUsers, storageKeys } from '../../app.data';
import { CompanyBranding, User } from '../../app.models';

const SESSION_KEY = storageKeys.session;
const USERS_KEY = storageKeys.users;
const BRANDING_KEY = storageKeys.branding;

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userSignal = signal<User | null>(null);

  readonly user = this.userSignal.asReadonly();
  readonly isLoggedIn = computed(() => this.userSignal() !== null);
  readonly isAdmin = computed(() => this.userSignal()?.role === 'admin');

  constructor(private readonly router: Router) {
    this.seedStorage();
    this.restoreSession();
  }

  login(email: string, password: string): boolean {
    const users = this.readUsers();
    const user = users.find(
      (entry) => entry.email.toLowerCase() === email.toLowerCase().trim() && entry.password === password,
    );

    if (!user) {
      return false;
    }

    this.userSignal.set(user);
    this.writeJson(SESSION_KEY, user);
    return true;
  }

  logout(): void {
    this.userSignal.set(null);
    this.removeItem(SESSION_KEY);
    void this.router.navigateByUrl('/login');
  }

  getCompanyBranding(companyId: string): CompanyBranding {
    const branding = this.readJson<CompanyBranding>(BRANDING_KEY);
    if (branding && branding.companyId === companyId) {
      return branding;
    }

    return defaultBranding;
  }

  private seedStorage(): void {
    if (!this.readJson<User[]>(USERS_KEY)?.length) {
      this.writeJson(USERS_KEY, defaultUsers);
    }

    if (!this.readJson<CompanyBranding>(BRANDING_KEY)) {
      this.writeJson(BRANDING_KEY, defaultBranding);
    }
  }

  private restoreSession(): void {
    const session = this.readJson<User>(SESSION_KEY);
    if (session) {
      this.userSignal.set(session);
    }
  }

  private readUsers(): User[] {
    return this.readJson<User[]>(USERS_KEY) ?? defaultUsers;
  }

  private readJson<T>(key: string): T | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private writeJson<T>(key: string, value: T): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage failures in the MVP.
    }
  }

  private removeItem(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures in the MVP.
    }
  }
}

