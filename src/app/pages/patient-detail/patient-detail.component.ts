import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Allergy, Encounter, Institution, Medication, ModuleCode, Patient,
  PatientConsent, perm, Problem, SharedPatientRecord, VitalSign
} from '../../models/ehr.models';
import { PatientService } from '../../services/patient.service';
import { ClinicalService } from '../../services/clinical.service';
import { ConsentService } from '../../services/consent.service';
import { InstitutionService } from '../../services/institution.service';
import { InstitutionContextService } from '../../services/institution-context.service';
import { AuthService } from '../../services/auth.service';

interface TabDef { code: string; label: string; }

@Component({
  selector: 'app-patient-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './patient-detail.component.html',
  styleUrls: ['./patient-detail.component.css']
})
export class PatientDetailComponent implements OnInit {
  readonly MC = ModuleCode;

  patientId!: number;
  patient: Patient | null = null;
  current: Institution | null = null;
  institutions: Institution[] = [];

  /** Clinical-module tabs available for the active institution. */
  tabs: TabDef[] = [];
  activeTab = '';

  encounters: Encounter[] = [];
  problems: Problem[] = [];
  medications: Medication[] = [];
  allergies: Allergy[] = [];
  vitals: VitalSign[] = [];

  // Inline "add" models
  newProblem: Problem = { description: '' };
  newMedication: Medication = { name: '' };
  newAllergy: Allergy = { allergen: '' };
  newVital: VitalSign = {};
  newEncounter: Encounter = {};

  // Sharing
  consents: PatientConsent[] = [];
  grant = { grantedToInstitutionId: null as number | null, scope: 'ALL' };
  sharedRecord: SharedPatientRecord | null = null;
  shareViewInstitutionId: number | null = null;
  shareError = '';

  constructor(
    private route: ActivatedRoute,
    private patientService: PatientService,
    private clinical: ClinicalService,
    private consentService: ConsentService,
    private institutionService: InstitutionService,
    private context: InstitutionContextService,
    public auth: AuthService
  ) {}

  /** Whether the signed-in user may record/modify data in the given module. */
  canWrite(moduleCode: string): boolean {
    return this.auth.can(perm(moduleCode, 'WRITE'));
  }

  ngOnInit(): void {
    this.patientId = Number(this.route.snapshot.paramMap.get('id'));
    this.institutionService.getAll().subscribe(list => (this.institutions = list));
    this.patientService.getById(this.patientId).subscribe(p => (this.patient = p));

    this.context.current$.subscribe(c => (this.current = c));
    this.context.modules$.subscribe(() => this.buildTabs());
    this.buildTabs();
  }

  private buildTabs(): void {
    const candidates: TabDef[] = [
      { code: ModuleCode.ENCOUNTERS, label: 'Encounters' },
      { code: ModuleCode.PROBLEMS, label: 'Problems' },
      { code: ModuleCode.MEDICATIONS, label: 'Medications' },
      { code: ModuleCode.ALLERGIES, label: 'Allergies' }
    ];
    this.tabs = candidates.filter(t => this.context.isModuleEnabled(t.code));
    if (this.context.isModuleEnabled(ModuleCode.VITALS)) {
      this.tabs.push({ code: ModuleCode.VITALS, label: 'Vitals' });
    }
    // Sharing is always available (it is a platform capability, not a module).
    this.tabs.push({ code: 'SHARING', label: 'Sharing & Consent' });

    if (!this.tabs.some(t => t.code === this.activeTab)) {
      this.selectTab(this.tabs[0]?.code ?? '');
    }
  }

  selectTab(code: string): void {
    this.activeTab = code;
    switch (code) {
      case ModuleCode.ENCOUNTERS:
        this.clinical.getEncounters(this.patientId).subscribe(d => (this.encounters = d));
        break;
      case ModuleCode.PROBLEMS:
        this.clinical.getProblems(this.patientId).subscribe(d => (this.problems = d));
        break;
      case ModuleCode.MEDICATIONS:
        this.clinical.getMedications(this.patientId).subscribe(d => (this.medications = d));
        break;
      case ModuleCode.ALLERGIES:
        this.clinical.getAllergies(this.patientId).subscribe(d => (this.allergies = d));
        break;
      case ModuleCode.VITALS:
        this.clinical.getVitals(this.patientId).subscribe(d => (this.vitals = d));
        break;
      case 'SHARING':
        this.loadConsents();
        break;
    }
  }

  private get institutionId(): number | undefined {
    return this.current?.id;
  }

  // --- Problems --------------------------------------------------------------
  addProblem(): void {
    if (!this.newProblem.description) { return; }
    this.newProblem.institutionId = this.institutionId;
    this.clinical.addProblem(this.patientId, this.newProblem).subscribe(() => {
      this.newProblem = { description: '' };
      this.selectTab(ModuleCode.PROBLEMS);
    });
  }
  removeProblem(p: Problem): void {
    this.clinical.deleteProblem(p.id!).subscribe(() => this.selectTab(ModuleCode.PROBLEMS));
  }

  // --- Medications -----------------------------------------------------------
  addMedication(): void {
    if (!this.newMedication.name) { return; }
    this.newMedication.institutionId = this.institutionId;
    this.clinical.addMedication(this.patientId, this.newMedication).subscribe(() => {
      this.newMedication = { name: '' };
      this.selectTab(ModuleCode.MEDICATIONS);
    });
  }
  removeMedication(m: Medication): void {
    this.clinical.deleteMedication(m.id!).subscribe(() => this.selectTab(ModuleCode.MEDICATIONS));
  }

  // --- Allergies -------------------------------------------------------------
  addAllergy(): void {
    if (!this.newAllergy.allergen) { return; }
    this.newAllergy.institutionId = this.institutionId;
    this.clinical.addAllergy(this.patientId, this.newAllergy).subscribe(() => {
      this.newAllergy = { allergen: '' };
      this.selectTab(ModuleCode.ALLERGIES);
    });
  }
  removeAllergy(a: Allergy): void {
    this.clinical.deleteAllergy(a.id!).subscribe(() => this.selectTab(ModuleCode.ALLERGIES));
  }

  // --- Vitals ----------------------------------------------------------------
  addVital(): void {
    this.newVital.institutionId = this.institutionId;
    this.clinical.addVital(this.patientId, this.newVital).subscribe(() => {
      this.newVital = {};
      this.selectTab(ModuleCode.VITALS);
    });
  }
  removeVital(v: VitalSign): void {
    this.clinical.deleteVital(v.id!).subscribe(() => this.selectTab(ModuleCode.VITALS));
  }

  // --- Encounters ------------------------------------------------------------
  addEncounter(): void {
    if (!this.newEncounter.reason && !this.newEncounter.type) { return; }
    this.newEncounter.institutionId = this.institutionId;
    this.clinical.addEncounter(this.patientId, this.newEncounter).subscribe(() => {
      this.newEncounter = {};
      this.selectTab(ModuleCode.ENCOUNTERS);
    });
  }
  removeEncounter(e: Encounter): void {
    this.clinical.deleteEncounter(e.id!).subscribe(() => this.selectTab(ModuleCode.ENCOUNTERS));
  }

  // --- Sharing & Consent -----------------------------------------------------
  loadConsents(): void {
    this.consentService.list(this.patientId).subscribe(c => (this.consents = c));
  }

  grantConsent(): void {
    if (this.grant.grantedToInstitutionId == null) { return; }
    this.consentService.grant(this.patientId, {
      grantedToInstitutionId: this.grant.grantedToInstitutionId,
      scope: this.grant.scope || 'ALL'
    }).subscribe(() => {
      this.grant = { grantedToInstitutionId: null, scope: 'ALL' };
      this.loadConsents();
    });
  }

  revokeConsent(c: PatientConsent): void {
    this.consentService.revoke(this.patientId, c.id!).subscribe(() => this.loadConsents());
  }

  institutionName(id?: number): string {
    return this.institutions.find(i => i.id === id)?.name ?? ('#' + id);
  }

  /** Preview what a requesting institution would receive (consent-enforced). */
  viewSharedRecord(): void {
    this.sharedRecord = null;
    this.shareError = '';
    if (this.shareViewInstitutionId == null) { return; }
    this.consentService.getSharedRecord(this.patientId, this.shareViewInstitutionId).subscribe({
      next: rec => (this.sharedRecord = rec),
      error: err => {
        this.shareError = err?.error?.message
          || 'This institution has no active consent to view the record.';
      }
    });
  }
}
