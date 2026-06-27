import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Institution } from '../models/ehr.models';

@Injectable({ providedIn: 'root' })
export class InstitutionService {
  private readonly baseUrl = `${environment.apiUrl}/institutions`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Institution[]> {
    return this.http.get<Institution[]>(this.baseUrl);
  }

  getById(id: number): Observable<Institution> {
    return this.http.get<Institution>(`${this.baseUrl}/${id}`);
  }

  create(institution: Institution): Observable<Institution> {
    return this.http.post<Institution>(this.baseUrl, institution);
  }

  update(id: number, institution: Institution): Observable<Institution> {
    return this.http.put<Institution>(`${this.baseUrl}/${id}`, institution);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
