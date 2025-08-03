import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ButtonGroupModule } from 'primeng/buttongroup';
import * as AuthActions from './auth/store/auth.actions';
import * as AuthSelectors from './auth/store/auth.selectors';
import { Router } from '@angular/router';
import { AuthInitService } from './auth/services/auth-init.service';
import { SessionInitService } from './home/services/session-init.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ButtonModule, ButtonGroupModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'nudge-app';

   loggedIn$ = this.store.pipe(select(AuthSelectors.selectLoggedIn));

  constructor(private store: Store, private router: Router, authInit: AuthInitService, sessionInit: SessionInitService) 
  {
    authInit.initAuth();
    sessionInit.initSession();
  }

  logout() {
    this.store.dispatch(AuthActions.logoutUser());
    this.router.navigate(['/login']);
  }
}