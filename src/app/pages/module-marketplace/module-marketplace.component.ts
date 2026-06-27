import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Institution, ModuleStatus } from '../../models/ehr.models';
import { ModuleService } from '../../services/module.service';
import { InstitutionContextService } from '../../services/institution-context.service';

@Component({
  selector: 'app-module-marketplace',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './module-marketplace.component.html'
})
export class ModuleMarketplaceComponent implements OnInit {
  current: Institution | null = null;
  modules: ModuleStatus[] = [];
  saving: { [code: string]: boolean } = {};

  constructor(
    private moduleService: ModuleService,
    private context: InstitutionContextService
  ) {}

  ngOnInit(): void {
    this.context.current$.subscribe(c => {
      this.current = c;
      this.load();
    });
  }

  private load(): void {
    if (this.current?.id == null) { return; }
    this.moduleService.getForInstitution(this.current.id).subscribe(m => (this.modules = m));
  }

  toggle(module: ModuleStatus): void {
    if (this.current?.id == null) { return; }
    const next = !module.enabled;
    this.saving[module.code] = true;
    this.moduleService.setEnabled(this.current.id, module.code, next).subscribe({
      next: updated => {
        module.enabled = updated.enabled;
        this.saving[module.code] = false;
        // Propagate so navigation/chart tabs reflect the change immediately.
        this.context.refreshModules();
      },
      error: () => (this.saving[module.code] = false)
    });
  }

  get categories(): string[] {
    return Array.from(new Set(this.modules.map(m => m.category || 'Other')));
  }

  byCategory(category: string): ModuleStatus[] {
    return this.modules.filter(m => (m.category || 'Other') === category);
  }
}
