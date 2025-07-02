import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  register(name: string, email: string, password: string): Observable<any> {
    console.log('Registering user:', { name, email, password });

   return this.http.post(`${environment.apiBaseUrl}/register`, { name, email, password });
  }

  login(email: string, password: string) {
  return this.http.post<{ access_token: string }>(`${environment.apiBaseUrl}/login`, { email, password });
}
}