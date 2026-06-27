import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Institution, ModuleStatus } from '../../models/ehr.models';
import { InstitutionContextService } from '../../services/institution-context.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  current: Institution | null = null;
  modules: ModuleStatus[] = [];

  constructor(private context: InstitutionContextService) {}

  ngOnInit(): void {
    this.context.current$.subscribe(c => (this.current = c));
    this.context.modules$.subscribe(m => (this.modules = m));
  }

  get enabled(): ModuleStatus[] {
    return this.modules.filter(m => m.enabled);
  }

  get disabled(): ModuleStatus[] {
    return this.modules.filter(m => !m.enabled);
  }
}
