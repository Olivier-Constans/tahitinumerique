import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TimezoneResponse } from '../../../shared/model/timezone.model';
import { DatePipe } from '@angular/common';
import { ADMIN_PATH } from '../../../app.routes';

@Component({
  imports: [DatePipe, RouterLink],
  templateUrl: './timezone.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimezoneComponent {
  protected readonly ADMIN_PATH = ADMIN_PATH;

  // Alimenté par le resolver de la route via withComponentInputBinding
  readonly data = input.required<TimezoneResponse>();
}
