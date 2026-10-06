import {Component, DestroyRef} from '@angular/core';
import {ActivatedRoute, RouterLink} from "@angular/router";
import {TimezoneResponse} from "../../../shared/model/timezone.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {DatePipe} from "@angular/common";
import {ADMIN_PATH} from "../../../app.routes";

@Component({
    imports: [
        DatePipe,
        RouterLink
    ],
    templateUrl: './timezone.component.html'
})
export class TimezoneComponent {

  data: TimezoneResponse;

  constructor(
    private readonly _route: ActivatedRoute,
    private readonly _destroyRef:	DestroyRef
  ) {
    this.data = _route.snapshot.data['data'];

    this._route.params
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => {
      this.data = _route.snapshot.data['data'];
    })
  }

    protected readonly ADMIN_PATH = ADMIN_PATH;
}
