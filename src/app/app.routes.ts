import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PatientListComponent } from './pages/patient-list/patient-list.component';
import { PatientDetailComponent } from './pages/patient-detail/patient-detail.component';
import { ModuleMarketplaceComponent } from './pages/module-marketplace/module-marketplace.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'patients', component: PatientListComponent },
  { path: 'patients/:id', component: PatientDetailComponent },
  { path: 'modules', component: ModuleMarketplaceComponent },
  { path: '**', redirectTo: '/dashboard' }
];
