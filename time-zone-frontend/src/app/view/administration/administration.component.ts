import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Button } from 'primeng/button';
import { TimezoneService } from '../../shared/service/timezone.service';
import { catchError, EMPTY, of, switchMap } from 'rxjs';
import { TimezoneResponse } from '../../shared/model/timezone.model';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TIMEZONE_PATH } from './administration.routes';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Tooltip } from 'primeng/tooltip';
import { ProgressSpinner } from 'primeng/progressspinner';

@Component({
  imports: [Button, PaginatorModule, RouterLink, ConfirmDialog, Tooltip, ProgressSpinner],
  providers: [ConfirmationService],
  templateUrl: './administration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministrationComponent {
  private readonly _timezoneService = inject(TimezoneService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _confirmationService = inject(ConfirmationService);
  private readonly _messageService = inject(MessageService);

  protected readonly TIMEZONE_PATH = TIMEZONE_PATH;

  readonly page = signal(0);
  readonly rows = signal(10);
  readonly first = computed(() => this.page() * this.rows());

  // Incrémenté pour forcer le rechargement de la page courante (ex : après suppression)
  private readonly _refresh = signal(0);

  private readonly _search = computed(() => ({
    page: this.page(),
    rows: this.rows(),
    refresh: this._refresh(),
  }));

  // null signale un échec de chargement ; l'erreur est absorbée pour ne pas couper le flux de pagination
  readonly result = toSignal(
    toObservable(this._search).pipe(
      switchMap(({ page, rows }) =>
        this._timezoneService.getAllTimezones(page, rows).pipe(catchError(() => of(null))),
      ),
    ),
  );

  retry() {
    this._refresh.update((value) => value + 1);
  }

  onPageChange($event: PaginatorState) {
    this.page.set($event.page ?? this.page());
    this.rows.set($event.rows ?? this.rows());
  }

  delete(data: TimezoneResponse) {
    this._confirmationService.confirm({
      header: 'Supprimer le fuseau horaire',
      message: `Supprimer le fuseau « ${data.label} » ? Cette action est définitive.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      defaultFocus: 'reject',
      accept: () => this._deleteTimezone(data),
    });
  }

  private _deleteTimezone(data: TimezoneResponse) {
    this._timezoneService
      .deleteTimezone(data.id)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        catchError(() => EMPTY),
      )
      .subscribe(() => {
        this._messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: `Fuseau horaire « ${data.label} » supprimé.`,
        });
        this._refresh.update((value) => value + 1);
      });
  }
}
