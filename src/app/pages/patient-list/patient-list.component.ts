import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Institution, Patient } from '../../models/ehr.models';
import { PatientService } from '../../services/patient.service';
import { InstitutionContextService } from '../../services/institution-context.service';

@Component({
  selector: 'app-patient-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './patient-list.component.html'
})
export class PatientListComponent implements OnInit {
  patients: Patient[] = [];
  searchTerm = '';
  loading = false;
  showForm = false;
  current: Institution | null = null;

  newPatient: Patient = this.blankPatient();

  constructor(
    private patientService: PatientService,
    private context: InstitutionContextService
  ) {}

  ngOnInit(): void {
    this.context.current$.subscribe(c => (this.current = c));
    this.load();
  }

  load(): void {
    this.loading = true;
    this.patientService.list(this.searchTerm.trim() || undefined).subscribe({
      next: list => {
        this.patients = list;
        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (this.showForm) {
      this.newPatient = this.blankPatient();
      this.newPatient.homeInstitutionId = this.current?.id;
    }
  }

  create(): void {
    if (!this.newPatient.mrn || !this.newPatient.firstName || !this.newPatient.lastName) {
      return;
    }
    this.patientService.create(this.newPatient).subscribe(() => {
      this.showForm = false;
      this.load();
    });
  }

  private blankPatient(): Patient {
    return { mrn: '', firstName: '', lastName: '', gender: '', homeInstitutionId: this.current?.id };
  }
}
