import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PatientListComponent } from './pages/patient-list/patient-list.component';
import { PatientDetailComponent } from './pages/patient-detail/patient-detail.component';
import { ModuleMarketplaceComponent } from './pages/module-marketplace/module-marketplace.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'patients', component: PatientListComponent, canActivate: [authGuard] },
  { path: 'patients/:id', component: PatientDetailComponent, canActivate: [authGuard] },
  { path: 'modules', component: ModuleMarketplaceComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/dashboard' }
];
