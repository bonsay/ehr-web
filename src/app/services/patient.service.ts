import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Patient } from '../models/ehr.models';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private readonly baseUrl = `${environment.apiUrl}/patients`;

  constructor(private http: HttpClient) {}

  list(search?: string, institutionId?: number): Observable<Patient[]> {
    let params = new HttpParams();
    if (search) { params = params.set('search', search); }
    if (institutionId != null) { params = params.set('institutionId', String(institutionId)); }
    return this.http.get<Patient[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.baseUrl}/${id}`);
  }

  create(patient: Patient): Observable<Patient> {
    return this.http.post<Patient>(this.baseUrl, patient);
  }

  update(id: number, patient: Patient): Observable<Patient> {
    return this.http.put<Patient>(`${this.baseUrl}/${id}`, patient);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
