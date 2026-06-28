import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Username/password sign-in for local security mode. (In OIDC mode the app
 * redirects to the identity provider instead and never shows this page.)
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  busy = false;

  /** Demo accounts surfaced on the login screen for convenience. */
  readonly demoAccounts = [
    { username: 'admin', role: 'Administrator — manages users, roles & modules' },
    { username: 'physician', role: 'Physician — full clinical access incl. prescribing' },
    { username: 'nurse', role: 'Nurse — vitals & encounters, no prescribing' },
    { username: 'reception', role: 'Receptionist — patient demographics' }
  ];

  constructor(private auth: AuthService, private router: Router) {}

  async submit(): Promise<void> {
    if (!this.username || !this.password) {
      return;
    }
    this.busy = true;
    this.error = '';
    try {
      await this.auth.loginLocal(this.username.trim(), this.password);
      this.router.navigateByUrl('/dashboard');
    } catch (e: any) {
      this.error = e?.error?.message || 'Sign-in failed. Check your username and password.';
    } finally {
      this.busy = false;
    }
  }

  /** Prefill a demo account (password follows the seeded "<name>123" pattern). */
  prefill(username: string): void {
    this.username = username;
    this.password = `${username}123`;
    this.error = '';
  }
}
