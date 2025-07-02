import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, map, take } from 'rxjs';
import { selectLoggedIn } from '../auth/store/auth.selectors';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private store: Store, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.store.select(selectLoggedIn).pipe(
      take(1),
      map(loggedIn => {
        if (loggedIn) {
          this.router.navigate(['/home']);
          return false;
        }
        return true;
      })
    );
  }
}