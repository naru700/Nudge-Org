import { provideHttpClient, withJsonpSupport } from '@angular/common/http';
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideEffects } from '@ngrx/effects';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AuthEffects } from './auth/store/auth.effects';
import { authReducer } from './auth/store/auth.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withJsonpSupport()),
    provideAnimations(),
    provideStore({ auth: authReducer }),
    provideEffects([AuthEffects]),
    // Only include DevTools in development mode
    ...(!environment.production ? [
      provideStoreDevtools({
        maxAge: 25,
        logOnly: environment.production,
        autoPause: true,
        trace: false,
        traceLimit: 75
      })
    ] : [])
  ]
};
