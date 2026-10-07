import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  formatZoneOffset,
  PLACE_TYPE_LABELS,
  PlaceResponse,
  ZONE_ID,
} from '../../../shared/model/place.model';
import { DatePipe } from '@angular/common';
import { ADMIN_PATH } from '../../../app.routes';

@Component({
  imports: [DatePipe, RouterLink],
  templateUrl: './place.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceComponent {
  protected readonly ADMIN_PATH = ADMIN_PATH;
  protected readonly ZONE_ID = ZONE_ID;
  protected readonly PLACE_TYPE_LABELS = PLACE_TYPE_LABELS;
  protected readonly formatZoneOffset = formatZoneOffset;
  protected readonly timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  // Alimenté par le resolver de la route via withComponentInputBinding
  readonly data = input.required<PlaceResponse>();
}
