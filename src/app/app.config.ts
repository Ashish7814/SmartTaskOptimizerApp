import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors,  } from '@angular/common/http';
import 'zone.js';

// export const appConfig: ApplicationConfig = {
//   // providers: [
//   //   provideHttpClient(withFetch()),
//   //   // ... other providers
//   // ]
//    providers: [
//     provideZoneChangeDetection({ eventCoalescing: true }),
//     provideRouter(routes),
//     provideHttpClient(),
//     // provideHttpClient(withInterceptors([withInterceptors]))
//   ]
// };

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }), // ✅ zone-based
    provideRouter(routes),
    provideHttpClient(),
  ]
};
