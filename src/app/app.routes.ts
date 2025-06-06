import { Routes } from '@angular/router';
import { SessionComponent } from './session/session/session.component';

export const routes: Routes = [
  { path: '', redirectTo: 'session', pathMatch: 'full' },
  { path: 'session', component: SessionComponent },
];

