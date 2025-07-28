import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http'; 
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { routes } from './app.routes';
import { homeSessionInputsReducer } from './home/store/home.reducer';
import { HomeEffects } from './home/store/home.effects';
import { routes } from './app.routes';
import { authReducer } from './auth/store/auth.reducer';
import { AuthEffects } from './auth/store/auth.effects';

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
