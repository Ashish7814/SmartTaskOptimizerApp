import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
})
export class SettingsComponent {

// import { HttpInterceptorFn } from '@angular/common/http';

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   // Add authentication token if available
//   const token = localStorage.getItem('auth_token');
  
//   if (token) {
//     req = req.clone({
//       setHeaders: {
//         Authorization: `Bearer ${token}`
//       }
//     });
//   }

//   return next(req);
// };
// export const environment = {
//   production: true,
//   apiUrl: 'http://localhost:5000/api'
// };
// export const environment = {
//   production: false,
//   apiUrl: 'http://localhost:5000/api'
// };
}
