import {ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal} from '@angular/core';
import {Button} from "primeng/button";
import {TimezoneService} from "../../shared/service/timezone.service";
import {switchMap} from "rxjs";
import {TimezoneResponse} from "../../shared/model/timezone.model";
import {PaginatorModule, PaginatorState} from "primeng/paginator";
import {RouterLink} from "@angular/router";
import {takeUntilDestroyed, toObservable, toSignal} from "@angular/core/rxjs-interop";
import {TIMEZONE_PATH} from "./administration.routes";

@Component({
    imports: [
        Button,
        PaginatorModule,
        RouterLink
    ],
    templateUrl: './administration.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdministrationComponent {

  private readonly _timezoneService = inject(TimezoneService);
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly TIMEZONE_PATH = TIMEZONE_PATH;

  readonly page = signal(0);
  readonly rows = signal(10);
  readonly first = computed(() => this.page() * this.rows());

  // Incrémenté pour forcer le rechargement de la page courante (ex : après suppression)
  private readonly _refresh = signal(0);

  private readonly _search = computed(() => ({page: this.page(), rows: this.rows(), refresh: this._refresh()}));

  readonly result = toSignal(toObservable(this._search).pipe(
    switchMap(({page, rows}) => this._timezoneService.getAllTimezones(page, rows))
  ));

  onPageChange($event: PaginatorState) {
    this.page.set($event.page ?? this.page());
    this.rows.set($event.rows ?? this.rows());
  }

  delete(data: TimezoneResponse) {
    this._timezoneService.deleteTimezone(data.id)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(() => this._refresh.update(value => value + 1))
  }
}
