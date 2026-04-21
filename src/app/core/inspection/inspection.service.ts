import { Injectable, computed, signal } from '@angular/core';
import { storageKeys } from '../../app.data';
import { AppDraft, InspectionRecord } from '../../app.models';

const INSPECTIONS_KEY = storageKeys.inspections;
const DRAFT_KEY = storageKeys.draft;

@Injectable({
  providedIn: 'root',
})
export class InspectionService {
  private readonly inspectionsSignal = signal<InspectionRecord[]>(this.readInspections());
  private readonly draftSignal = signal<AppDraft | null>(this.readDraft());

  readonly inspections = this.inspectionsSignal.asReadonly();
  readonly draft = this.draftSignal.asReadonly();
  readonly total = computed(() => this.inspectionsSignal().length);

  saveInspection(record: InspectionRecord): void {
    const now = new Date().toISOString();
    const normalized: InspectionRecord = {
      ...record,
      createdAt: record.createdAt || now,
      updatedAt: now,
    };

    const next = [
      normalized,
      ...this.inspectionsSignal().filter((item) => item.id !== normalized.id),
    ];

    this.persist(next);
  }

  removeInspection(id: string): void {
    const next = this.inspectionsSignal().filter((item) => item.id !== id);
    this.persist(next);
  }

  refresh(): void {
    this.inspectionsSignal.set(this.readInspections());
    this.draftSignal.set(this.readDraft());
  }

  saveDraft(draft: AppDraft): void {
    this.draftSignal.set(draft);
    this.writeJson(DRAFT_KEY, draft);
  }

  clearDraft(): void {
    this.draftSignal.set(null);
    this.removeItem(DRAFT_KEY);
  }

  getDraft(): AppDraft | null {
    return this.draftSignal();
  }

  hasDraft(): boolean {
    return this.draftSignal() !== null;
  }

  private readInspections(): InspectionRecord[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(INSPECTIONS_KEY);
      return raw ? (JSON.parse(raw) as InspectionRecord[]) : [];
    } catch {
      return [];
    }
  }

  private readDraft(): AppDraft | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(DRAFT_KEY);
      return raw ? (JSON.parse(raw) as AppDraft) : null;
    } catch {
      return null;
    }
  }

  private persist(items: InspectionRecord[]): void {
    this.inspectionsSignal.set(items);

    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(INSPECTIONS_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage failures in the MVP.
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
