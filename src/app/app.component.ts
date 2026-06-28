import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Institution } from './models/ehr.models';
import { InstitutionContextService } from './services/institution-context.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  institutions: Institution[] = [];
  current: Institution | null = null;

  constructor(
    public context: InstitutionContextService,
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.auth.hasValidToken()) {
      this.context.initialize().subscribe(list => (this.institutions = list));
    }
    this.context.current$.subscribe(c => (this.current = c));
  }

  signOut(): void {
    this.auth.logout();
    if (this.auth.isLocal) {
      this.router.navigateByUrl('/login');
    }
  }

  onInstitutionChange(value: string): void {
    const inst = this.institutions.find(i => i.id === Number(value));
    if (inst) {
      this.context.setCurrent(inst);
    }
  }
}
