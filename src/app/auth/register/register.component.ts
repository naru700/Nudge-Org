import { Component, inject } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { Router, RouterModule } from '@angular/router';
import { AuthState } from '../store/auth.reducer';
import * as AuthActions from '../store/auth.actions';
import * as AuthSelectors from '../store/auth.selectors';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    RouterModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  registerForm!: FormGroup;
  store = inject(Store<{ auth: AuthState }>);
  registering$ = this.store.pipe(select(AuthSelectors.selectRegistering));
  registered$ = this.store.pipe(select(AuthSelectors.selectRegistered));
  error$ = this.store.pipe(select(AuthSelectors.selectAuthError));

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatchValidator });
     this.registered$.subscribe((registered) => {
    if (registered) {
      this.router.navigate(['/login']);
    }
  });
  }

  passwordsMatchValidator(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return password === confirm ? null : { passwordsMismatch: true };
  }

  register() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    const { name, email, password } = this.registerForm.value;
    this.store.dispatch(AuthActions.registerUser({ name, email, password }));
  }

  get f() {
    return this.registerForm.controls;
  }
}