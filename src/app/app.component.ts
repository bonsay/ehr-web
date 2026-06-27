import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Institution } from './models/ehr.models';
import { InstitutionContextService } from './services/institution-context.service';

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

  constructor(public context: InstitutionContextService) {}

  ngOnInit(): void {
    this.context.initialize().subscribe(list => (this.institutions = list));
    this.context.current$.subscribe(c => (this.current = c));
  }

  onInstitutionChange(value: string): void {
    const inst = this.institutions.find(i => i.id === Number(value));
    if (inst) {
      this.context.setCurrent(inst);
    }
  }
}
