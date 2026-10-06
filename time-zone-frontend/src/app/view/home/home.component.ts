import {ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, signal} from '@angular/core';
import {DatePipe} from "@angular/common";
import {DatePicker} from "primeng/datepicker";
import {FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {Select} from "primeng/select";
import {Button} from "primeng/button";
import {ScrollerOptions} from "primeng/api";
import {TimezoneResponse} from "../../shared/model/timezone.model";
import {TimezoneService} from "../../shared/service/timezone.service";
import {takeUntilDestroyed, toSignal} from "@angular/core/rxjs-interop";
import {catchError, EMPTY, finalize, of, Subject, switchMap} from "rxjs";
import {ScrollerLazyLoadEvent} from "primeng/types/scroller";
import {CalculateDateRequest} from "../../shared/model/calculateDate.model";
import {transformToUTCDate} from "../../shared/util/date.util";
import {RouterLink} from "@angular/router";
import {ADMIN_PATH} from "../../app.routes";
import {TIMEZONE_PATH} from "../administration/administration.routes";


export interface HomeForm {
  dateSearch: FormControl<Date | undefined>,
  timezone: FormControl<TimezoneResponse | undefined>
}

@Component({
    imports: [
        DatePipe,
        DatePicker,
        ReactiveFormsModule,
        Select,
        Button,
        RouterLink
    ],
    templateUrl: './home.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {

  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _timezoneService = inject(TimezoneService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _changeDetectorRef = inject(ChangeDetectorRef);

  protected readonly ADMIN_PATH = ADMIN_PATH;
  protected readonly TIMEZONE_PATH = TIMEZONE_PATH;

  readonly form = this._formBuilder.group<HomeForm>({
    dateSearch: this._formBuilder.control(undefined, Validators.required),
    timezone: this._formBuilder.control(undefined, Validators.required)
  })

  readonly timezones = signal<TimezoneResponse[]>([]);
  readonly timezonesLoaded = signal(false);
  readonly timezonesLoadError = signal(false);
  readonly timezoneScrollerOptions: ScrollerOptions = {
    showLoader: false,
    lazy: true,
    onLazyLoad: (event: ScrollerLazyLoadEvent) => this.onLazyLoadTimezone(event)
  }

  private readonly _timezonePageSize = 10;
  private _timezonePage = 0;
  private _timezoneTotalPage = 0;
  private _timezoneLoading = false;

  private readonly _calculateDate = new Subject<CalculateDateRequest>();
  readonly result = toSignal(this._calculateDate.pipe(
    switchMap(form => this._timezoneService.calculateDate(form).pipe(
      catchError(() => of(undefined))
    ))
  ));

  constructor() {
    this.loadTimezones();
  }

  loadTimezones() {
    this.timezonesLoadError.set(false);
    this._timezoneService.getAllTimezones(0, this._timezonePageSize)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: data => {
          this.timezones.set(data.content);
          this._timezonePage = data.number;
          this._timezoneTotalPage = data.totalPages;
          this.timezonesLoaded.set(true);
        },
        error: () => this.timezonesLoadError.set(true)
      });
  }

  onLazyLoadTimezone(event: ScrollerLazyLoadEvent) {
    const nearEnd = event.last + 5 >= this.timezones().length
    const hasMorePage = this._timezonePage < this._timezoneTotalPage - 1
    if(this._timezoneLoading || !nearEnd || !hasMorePage) {
      return;
    }

    this._timezoneLoading = true
    this._timezoneService.getAllTimezones(this._timezonePage + 1, this._timezonePageSize)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        catchError(() => EMPTY),
        finalize(() => this._timezoneLoading = false)
      )
      .subscribe(data => {
        this.timezones.update(items => [...items, ...data.content]);
        this._timezonePage = data.number;
        this._timezoneTotalPage = data.totalPages;
      });
  }

  // Le scroller virtuel de PrimeNG ne s'initialise qu'une fois l'overlay visible :
  // on relance la détection de changements à l'ouverture pour qu'il affiche les options.
  onShowTimezone() {
    this._changeDetectorRef.detectChanges();
  }

  onSubmit() {
    if(this.form.invalid) {
      return;
    }
    this._calculateDate.next({
      date: transformToUTCDate(this.form.controls.dateSearch.value!),
      timezoneId: this.form.controls.timezone.value!.id
    })
  }
}
