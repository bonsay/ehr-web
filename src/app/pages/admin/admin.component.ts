import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Institution, ManagedUser, Role } from '../../models/ehr.models';
import { AdminService } from '../../services/admin.service';
import { InstitutionService } from '../../services/institution.service';
import { AuthService } from '../../services/auth.service';

interface NewUser {
  username: string;
  password: string;
  fullName: string;
  institutionId: number | null;
  roleCode: string;
}

/**
 * Administration console. An administrator manages:
 *  - Roles: which module permissions each clinician role grants (the matrix that
 *    decides, e.g., that a nurse records vitals but a physician prescribes).
 *  - Users: provisioning accounts and assigning each user a role.
 */
@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  section: 'roles' | 'users' = 'roles';

  roles: Role[] = [];
  catalog: Record<string, string[]> = {};
  /** Working copy of each role's permissions, keyed by role code. */
  draft: Record<string, Set<string>> = {};
  roleSaving: Record<string, boolean> = {};
  roleMessage: Record<string, string> = {};

  users: ManagedUser[] = [];
  institutions: Institution[] = [];

  newUser: NewUser = this.emptyUser();
  userError = '';
  createBusy = false;

  constructor(
    private admin: AdminService,
    private institutionService: InstitutionService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.institutionService.getAll().subscribe(list => (this.institutions = list));
    this.reloadRoles();
    this.reloadUsers();
    this.admin.permissionCatalog().subscribe(c => (this.catalog = c));
  }

  get canManageRoles(): boolean { return this.auth.can('ADMIN:ROLES'); }
  get canManageUsers(): boolean { return this.auth.can('ADMIN:USERS'); }

  // ---- Roles ----------------------------------------------------------------
  reloadRoles(): void {
    this.admin.listRoles().subscribe(roles => {
      this.roles = roles;
      this.draft = {};
      roles.forEach(r => (this.draft[r.code] = new Set(r.permissions)));
    });
  }

  groupNames(): string[] {
    return Object.keys(this.catalog);
  }

  hasPerm(roleCode: string, permission: string): boolean {
    return this.draft[roleCode]?.has(permission) ?? false;
  }

  togglePerm(roleCode: string, permission: string): void {
    const set = this.draft[roleCode];
    if (!set) { return; }
    if (set.has(permission)) {
      set.delete(permission);
    } else {
      set.add(permission);
    }
    this.roleMessage[roleCode] = '';
  }

  isDirty(role: Role): boolean {
    const set = this.draft[role.code];
    if (!set) { return false; }
    if (set.size !== role.permissions.length) { return true; }
    return role.permissions.some(p => !set.has(p));
  }

  saveRole(role: Role): void {
    const permissions = Array.from(this.draft[role.code] ?? []);
    this.roleSaving[role.code] = true;
    this.roleMessage[role.code] = '';
    this.admin.updateRolePermissions(role.code, permissions).subscribe({
      next: updated => {
        Object.assign(role, updated);
        this.draft[role.code] = new Set(updated.permissions);
        this.roleSaving[role.code] = false;
        this.roleMessage[role.code] = 'Saved.';
      },
      error: err => {
        this.roleSaving[role.code] = false;
        this.roleMessage[role.code] = err?.error?.message || 'Could not save role.';
      }
    });
  }

  // ---- Users ----------------------------------------------------------------
  reloadUsers(): void {
    this.admin.listUsers().subscribe(users => (this.users = users));
  }

  institutionName(id?: number | null): string {
    if (id == null) { return '—'; }
    return this.institutions.find(i => i.id === id)?.name ?? ('#' + id);
  }

  createUser(): void {
    this.userError = '';
    if (!this.newUser.username || !this.newUser.password || !this.newUser.roleCode) {
      this.userError = 'Username, password and role are required.';
      return;
    }
    this.createBusy = true;
    this.admin.createUser({
      username: this.newUser.username.trim(),
      password: this.newUser.password,
      fullName: this.newUser.fullName || undefined,
      institutionId: this.newUser.institutionId,
      roleCode: this.newUser.roleCode
    }).subscribe({
      next: () => {
        this.newUser = this.emptyUser();
        this.createBusy = false;
        this.reloadUsers();
      },
      error: err => {
        this.createBusy = false;
        this.userError = err?.error?.message || 'Could not create user.';
      }
    });
  }

  changeRole(user: ManagedUser, roleCode: string): void {
    this.admin.updateUser(user.id!, { roleCode }).subscribe({
      next: updated => Object.assign(user, updated),
      error: err => {
        alert(err?.error?.message || 'Could not change role.');
        this.reloadUsers();
      }
    });
  }

  toggleEnabled(user: ManagedUser): void {
    this.admin.updateUser(user.id!, { enabled: !user.enabled }).subscribe({
      next: updated => Object.assign(user, updated),
      error: err => alert(err?.error?.message || 'Could not update user.')
    });
  }

  changeInstitution(user: ManagedUser, institutionId: number | null): void {
    this.admin.updateUser(user.id!, { institutionId }).subscribe({
      next: updated => Object.assign(user, updated),
      error: err => alert(err?.error?.message || 'Could not update institution.')
    });
  }

  deleteUser(user: ManagedUser): void {
    if (!confirm(`Delete user "${user.username}"?`)) { return; }
    this.admin.deleteUser(user.id!).subscribe({
      next: () => this.reloadUsers(),
      error: err => alert(err?.error?.message || 'Could not delete user.')
    });
  }

  private emptyUser(): NewUser {
    return { username: '', password: '', fullName: '', institutionId: null, roleCode: '' };
  }
}
