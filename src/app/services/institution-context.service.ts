import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Institution, ModuleStatus } from '../models/ehr.models';
import { InstitutionService } from './institution.service';
import { ModuleService } from './module.service';

const STORAGE_KEY = 'ehr.currentInstitutionId';

/**
 * Holds the "acting as" institution for the session. The selected institution
 * determines which modules are enabled, which in turn drives navigation and the
 * tabs shown on a patient's chart — the core of the modular experience.
 */
@Injectable({ providedIn: 'root' })
export class InstitutionContextService {

  private currentSubject = new BehaviorSubject<Institution | null>(null);
  private modulesSubject = new BehaviorSubject<ModuleStatus[]>([]);

  readonly current$: Observable<Institution | null> = this.currentSubject.asObservable();
  readonly modules$: Observable<ModuleStatus[]> = this.modulesSubject.asObservable();

  constructor(
    private institutionService: InstitutionService,
    private moduleService: ModuleService
  ) {}

  get current(): Institution | null {
    return this.currentSubject.value;
  }

  /** Load institutions and restore (or default) the active one. */
  initialize(): Observable<Institution[]> {
    return this.institutionService.getAll().pipe(
      tap(institutions => {
        const savedId = Number(localStorage.getItem(STORAGE_KEY));
        const restored = institutions.find(i => i.id === savedId) ?? institutions[0];
        if (restored) {
          this.setCurrent(restored);
        }
      })
    );
  }

  setCurrent(institution: Institution): void {
    this.currentSubject.next(institution);
    if (institution.id != null) {
      localStorage.setItem(STORAGE_KEY, String(institution.id));
      this.refreshModules(institution.id);
    }
  }

  /** Reload the enabled-module state for the active institution. */
  refreshModules(institutionId?: number): void {
    const id = institutionId ?? this.current?.id;
    if (id == null) { return; }
    this.moduleService.getForInstitution(id).subscribe(modules => {
      this.modulesSubject.next(modules);
    });
  }

  enabledModules(): ModuleStatus[] {
    return this.modulesSubject.value.filter(m => m.enabled);
  }

  isModuleEnabled(code: string): boolean {
    return this.modulesSubject.value.some(m => m.code === code && m.enabled);
  }

  /** Convenience: reselect by id (used by the institution dropdown). */
  selectById(id: number): void {
    const inst = this.institutionService.getById(id);
    inst.pipe(switchMap(i => of(i))).subscribe(i => this.setCurrent(i));
  }
}
