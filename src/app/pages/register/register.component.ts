import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Self-service sign-up (local security mode): create a free-tier institution and
 * its first administrator, then drop straight into the app. In OIDC mode users
 * are provisioned by the identity provider, so this page is not offered.
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  institutionName = '';
  institutionCode = '';
  adminFullName = '';
  adminUsername = '';
  adminPassword = '';
  error = '';
  busy = false;

  constructor(private auth: AuthService, private router: Router) {}

  async submit(): Promise<void> {
    if (!this.institutionName || !this.institutionCode || !this.adminUsername || !this.adminPassword) {
      return;
    }
    this.busy = true;
    this.error = '';
    try {
      await this.auth.register({
        institutionName: this.institutionName.trim(),
        institutionCode: this.institutionCode.trim(),
        adminUsername: this.adminUsername.trim(),
        adminPassword: this.adminPassword,
        adminFullName: this.adminFullName.trim() || undefined
      });
      this.router.navigateByUrl('/dashboard');
    } catch (e: any) {
      this.error = e?.error?.message || 'Registration failed. Please check your details and try again.';
    } finally {
      this.busy = false;
    }
  }
}
