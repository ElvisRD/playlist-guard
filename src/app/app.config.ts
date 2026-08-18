import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { credentialsInterceptor } from './interceptors/credentials';
import { errorInterceptor } from './interceptors/error';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch(), withInterceptors([credentialsInterceptor, errorInterceptor])),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
  ],
};
