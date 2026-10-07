import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { Button } from 'primeng/button';
import { PlaceService } from '../../shared/service/place.service';
import { catchError, EMPTY, of, switchMap } from 'rxjs';
import { PlaceResponse } from '../../shared/model/place.model';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { PLACE_PATH } from './administration.routes';
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
  private readonly _placeService = inject(PlaceService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _confirmationService = inject(ConfirmationService);
  private readonly _messageService = inject(MessageService);

  protected readonly PLACE_PATH = PLACE_PATH;

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
        this._placeService.getAllPlaces(page, rows).pipe(catchError(() => of(null))),
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

  delete(data: PlaceResponse) {
    this._confirmationService.confirm({
      header: 'Supprimer le lieu',
      message: `Supprimer le lieu « ${data.label} » ? Cette action est définitive.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonProps: { severity: 'danger' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      defaultFocus: 'reject',
      accept: () => this._deletePlace(data),
    });
  }

  private _deletePlace(data: PlaceResponse) {
    this._placeService
      .deletePlace(data.id)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        catchError(() => EMPTY),
      )
      .subscribe(() => {
        this._messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: `Lieu « ${data.label} » supprimé.`,
        });
        this._refresh.update((value) => value + 1);
      });
  }
}
