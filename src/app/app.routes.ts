import { Routes } from '@angular/router';
import { SessionComponent } from './session/session.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './guards/auth.gaurd';
import { AuthRequiredGuard } from './guards/auth-required.gaurd';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [AuthGuard] },
  { path: 'home', component: HomeComponent, canActivate: [AuthRequiredGuard] },
  { path: 'session', component: SessionComponent, canActivate: [AuthRequiredGuard] },
  { path: '**', redirectTo: 'login' },
];

