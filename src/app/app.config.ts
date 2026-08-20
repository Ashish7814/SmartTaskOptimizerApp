import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection
} from '@angular/core';

import {
  provideRouter
} from '@angular/router';

import {
  provideClientHydration,
  withEventReplay
} from '@angular/platform-browser';

import {
  provideHttpClient,
  withFetch,
  withInterceptors
} from '@angular/common/http';

import { routes } from './app.routes';

import {
  tokenInterceptor
} from './core/auth/token-interceptor';

import {
  AuthService
} from './core/auth/auth.service';

import 'zone.js';

export const appConfig: ApplicationConfig = {

  providers: [

    provideBrowserGlobalErrorListeners(),

    provideZoneChangeDetection({
      eventCoalescing: true
    }),

    provideRouter(
      routes
    ),

    provideClientHydration(
      withEventReplay()
    ),

    provideHttpClient(
      withFetch(),

      withInterceptors([
        tokenInterceptor
      ])
    ),

    /*
     * Restore authentication when
     * Angular starts.
     *
     * The browser sends the HttpOnly
     * refresh cookie automatically.
     */
    provideAppInitializer(
      () => {

        const auth =
          inject(AuthService);

        return auth.initialize();
      }
    )
  ]
};
