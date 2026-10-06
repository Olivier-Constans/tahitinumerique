import {Component, DestroyRef} from '@angular/core';
import {Button} from "primeng/button";
import {TimezoneService} from "../../shared/service/timezone.service";
import {Observable, take} from "rxjs";
import {Page} from "../../shared/model/page.model";
import {TimezoneResponse} from "../../shared/model/timezone.model";
import {AsyncPipe} from "@angular/common";
import {PaginatorModule, PaginatorState} from "primeng/paginator";
import {ADMIN_PATH} from "../../app.routes";
import {RouterLink} from "@angular/router";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {TIMEZONE_PATH} from "./administration.routes";

@Component({
    imports: [
        Button,
        AsyncPipe,
        PaginatorModule,
        RouterLink
    ],
    templateUrl: './administration.component.html'
})
export class AdministrationComponent {

  protected readonly TIMEZONE_PATH = TIMEZONE_PATH;

  $result: Observable<Page<TimezoneResponse>> | undefined
  page: number;

  rows: number;

  constructor(
    private readonly _timezoneService: TimezoneService,
    private _destroyRef:	DestroyRef
  ) {
    this.page = 0;
    this.rows = 10;
    this.runSearch();
  }

  get first(): number {
    return this.page * this.rows;
  }

  onPageChange($event: PaginatorState) {
    this.page = $event.page ?? this.page;
    this.rows = $event.rows ?? this.rows;
    this.runSearch();
  }

  runSearch() {
    this.$result = this._timezoneService.getAllTimezones(this.page, this.rows)
      .pipe(takeUntilDestroyed(this._destroyRef))
  }

  delete(data: TimezoneResponse) {
    this._timezoneService.deleteTimezone(data.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => { this.runSearch()})
  }
}
