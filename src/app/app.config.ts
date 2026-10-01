import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { credentialsInterceptor } from './interceptors/credentials';
import { errorInterceptor } from './interceptors/error';
import { GOOGLE_CLIENT_ID } from './services/google/google';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor, errorInterceptor])),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    {
      provide: GOOGLE_CLIENT_ID,
      useValue: '678156093676-mrhorqip5acg7qhf5k4penhahrhno93p.apps.googleusercontent.com',
    },
  ],
};
