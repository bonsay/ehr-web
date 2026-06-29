import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Institution, ModuleStatus, Permission } from '../../models/ehr.models';
import { ModuleService } from '../../services/module.service';
import { InstitutionContextService } from '../../services/institution-context.service';
import { AuthService } from '../../services/auth.service';

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
  /** Per-module in-flight state for trial/purchase actions. */
  buying: { [code: string]: boolean } = {};

  constructor(
    private moduleService: ModuleService,
    private context: InstitutionContextService,
    private auth: AuthService
  ) {}

  /** Only administrators may enable/disable modules for the institution. */
  get canManage(): boolean {
    return this.auth.can(Permission.ADMIN_MODULES);
  }

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
        this.apply(module, updated);
        this.saving[module.code] = false;
        // Propagate so navigation/chart tabs reflect the change immediately.
        this.context.refreshModules();
      },
      error: () => (this.saving[module.code] = false)
    });
  }

  /** True for a module that costs money (anything above the free tier). */
  isPaid(module: ModuleStatus): boolean {
    return !!module.tier && module.tier !== 'FREE';
  }

  /** A paid module the institution hasn't licensed yet — show Buy / Trial. */
  needsPurchase(module: ModuleStatus): boolean {
    return this.isPaid(module) && !module.entitled;
  }

  /** Monthly list price formatted for display, e.g. "$49/mo". */
  priceLabel(module: ModuleStatus): string {
    if (!this.isPaid(module) || !module.priceMonthlyCents) { return 'Free'; }
    const dollars = module.priceMonthlyCents / 100;
    const amount = Number.isInteger(dollars) ? dollars.toString() : dollars.toFixed(2);
    return `$${amount}/mo`;
  }

  /** Start a free trial of a paid module. */
  startTrial(module: ModuleStatus): void {
    this.runPurchase(module, id => this.moduleService.startTrial(id, module.code));
  }

  /** Purchase a paid module. */
  purchase(module: ModuleStatus): void {
    this.runPurchase(module, id => this.moduleService.purchase(id, module.code));
  }

  private runPurchase(module: ModuleStatus, call: (institutionId: number) => any): void {
    if (this.current?.id == null || !this.canManage) { return; }
    this.buying[module.code] = true;
    call(this.current.id).subscribe({
      next: (updated: ModuleStatus) => {
        this.apply(module, updated);
        this.buying[module.code] = false;
      },
      error: () => (this.buying[module.code] = false)
    });
  }

  /** Copy server-returned commercial/enabled state onto the displayed card. */
  private apply(module: ModuleStatus, updated: ModuleStatus): void {
    module.enabled = updated.enabled;
    module.entitled = updated.entitled;
    module.entitlementStatus = updated.entitlementStatus;
  }

  get categories(): string[] {
    return Array.from(new Set(this.modules.map(m => m.category || 'Other')));
  }

  byCategory(category: string): ModuleStatus[] {
    return this.modules.filter(m => (m.category || 'Other') === category);
  }
}
