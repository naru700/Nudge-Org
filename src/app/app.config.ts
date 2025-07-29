import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { routes } from './app.routes';
import { AuthEffects } from './auth/store/auth.effects';
import { authReducer } from './auth/store/auth.reducer';
import { HomeEffects } from './home/store/home.effects';
import { homeSessionInputsReducer } from './home/store/home.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    provideStore({ homeSessionInputs: homeSessionInputsReducer }),
    provideEffects([HomeEffects]),
    provideStore({ auth: authReducer }),
    provideEffects([AuthEffects])
  ]
};