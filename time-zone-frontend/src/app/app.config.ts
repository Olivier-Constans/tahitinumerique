import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { routes } from './app.routes';
import {provideHttpClient, withFetch} from "@angular/common/http";
import {providePrimeNG} from "primeng/config";
import {definePreset} from "@primeuix/themes";
import Lara from "@primeuix/themes/lara";

const LaraBlue = definePreset(Lara, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '{blue.100}',
      200: '{blue.200}',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '{blue.700}',
      800: '{blue.800}',
      900: '{blue.900}',
      950: '{blue.950}'
    }
  }
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withFetch()),
    providePrimeNG({
      theme: {
        preset: LaraBlue,
        options: {
          darkModeSelector: false
        }
      }
    })
  ]
};
