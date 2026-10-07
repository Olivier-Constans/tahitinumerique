import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { DatePicker } from 'primeng/datepicker';
import {
  FormControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Select } from 'primeng/select';
import { Button } from 'primeng/button';
import { ScrollerOptions } from 'primeng/api';
import { PlaceResponse } from '../../shared/model/place.model';
import { PlaceService } from '../../shared/service/place.service';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, finalize, map, merge, of, Subject, switchMap } from 'rxjs';
import { ScrollerLazyLoadEvent } from 'primeng/types/scroller';
import { CalculateDateResponse } from '../../shared/model/calculateDate.model';
import { transformToUTCDate } from '../../shared/util/date.util';
import { RouterLink } from '@angular/router';
import { ProgressSpinner } from 'primeng/progressspinner';
import { ADMIN_PATH } from '../../app.routes';
import { PLACE_PATH } from '../administration/administration.routes';

export interface HomeForm {
  dateSearch: FormControl<Date | undefined>;
  place: FormControl<PlaceResponse | undefined>;
}

// Saisie ayant servi au calcul, rappelée au-dessus des résultats
export interface CalculateDateSearch {
  date: Date;
  place: PlaceResponse;
}

export interface CalculateDateResult {
  search: CalculateDateSearch;
  response: CalculateDateResponse;
}

@Component({
  imports: [DatePipe, DatePicker, ReactiveFormsModule, Select, Button, RouterLink, ProgressSpinner],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _placeService = inject(PlaceService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _changeDetectorRef = inject(ChangeDetectorRef);

  protected readonly ADMIN_PATH = ADMIN_PATH;
  protected readonly PLACE_PATH = PLACE_PATH;

  readonly form = this._formBuilder.group<HomeForm>({
    dateSearch: this._formBuilder.control(undefined, Validators.required),
    place: this._formBuilder.control(undefined, Validators.required),
  });

  readonly places = signal<PlaceResponse[]>([]);
  readonly placesLoaded = signal(false);
  readonly placesLoadError = signal(false);
  readonly placeScrollerOptions: ScrollerOptions = {
    showLoader: false,
    lazy: true,
    onLazyLoad: (event: ScrollerLazyLoadEvent) => this.onLazyLoadPlace(event),
  };

  private readonly _placePageSize = 10;
  private _placePage = 0;
  private _placeTotalPage = 0;
  private _placeLoading = false;

  readonly calculating = signal(false);
  private readonly _calculateDate = new Subject<CalculateDateSearch>();
  // Toute modification du formulaire efface les résultats (et annule un calcul en cours) :
  // ceux affichés correspondent toujours à la saisie visible
  readonly result = toSignal(
    merge(this._calculateDate, this.form.valueChanges.pipe(map(() => null))).pipe(
      // switchMap désabonne la requête précédente (et exécute son finalize) avant d'appeler cette fonction
      switchMap((search) => {
        if (!search) {
          return of(undefined);
        }
        this.calculating.set(true);
        return this._placeService
          .calculateDate({
            date: transformToUTCDate(search.date),
            placeId: search.place.id,
          })
          .pipe(
            map((response): CalculateDateResult => ({ search, response })),
            catchError(() => of(undefined)),
            finalize(() => this.calculating.set(false)),
          );
      }),
    ),
  );

  constructor() {
    this.loadPlaces();
  }

  loadPlaces() {
    this.placesLoadError.set(false);
    this._placeService
      .getAllPlaces(0, this._placePageSize)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (data) => {
          this.places.set(data.content);
          this._placePage = data.number;
          this._placeTotalPage = data.totalPages;
          this.placesLoaded.set(true);
        },
        error: () => this.placesLoadError.set(true),
      });
  }

  onLazyLoadPlace(event: ScrollerLazyLoadEvent) {
    const nearEnd = event.last + 5 >= this.places().length;
    const hasMorePage = this._placePage < this._placeTotalPage - 1;
    if (this._placeLoading || !nearEnd || !hasMorePage) {
      return;
    }

    this._placeLoading = true;
    this._placeService
      .getAllPlaces(this._placePage + 1, this._placePageSize)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        catchError(() => EMPTY),
        finalize(() => (this._placeLoading = false)),
      )
      .subscribe((data) => {
        this.places.update((items) => [...items, ...data.content]);
        this._placePage = data.number;
        this._placeTotalPage = data.totalPages;
      });
  }

  onSubmit() {
    if (this.form.invalid || this.calculating()) {
      return;
    }
    this._calculateDate.next({
      date: this.form.controls.dateSearch.value!,
      place: this.form.controls.place.value!,
    });
  }
}
