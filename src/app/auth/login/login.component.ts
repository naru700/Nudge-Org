import { Component, inject } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import * as AuthActions from '../store/auth.actions';
import * as AuthSelectors from '../store/auth.selectors';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm!: FormGroup;
  store = inject(Store);
  loggingIn$ = this.store.pipe(select(AuthSelectors.selectLoggingIn));
  loggedIn$ = this.store.pipe(select(AuthSelectors.selectLoggedIn));
  error$ = this.store.pipe(select(AuthSelectors.selectAuthError));

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.loggedIn$.subscribe((loggedIn) => {
      if (loggedIn) {
        this.router.navigate(['/home']); // or your dashboard route
      }
    });
  }

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    const { email, password } = this.loginForm.value;
    this.store.dispatch(AuthActions.loginUser({ email, password }));
  }

  get f() {
    return this.loginForm.controls;
  }
}