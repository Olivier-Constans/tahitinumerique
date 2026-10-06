import {ChangeDetectorRef, Component, DestroyRef} from '@angular/core';
import {AsyncPipe, DatePipe, TitleCasePipe} from "@angular/common";
import {DatePicker} from "primeng/datepicker";
import {FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {Select} from "primeng/select";
import {Button} from "primeng/button";
import {TimezoneResponse} from "../../shared/model/timezone.model";
import {TimezoneService} from "../../shared/service/timezone.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {Observable} from "rxjs";
import {CaculateDateResponse} from "../../shared/model/calculateDate.model";
import {transformToUTCDate} from "../../shared/service/date.function";
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
        AsyncPipe,
        RouterLink,
        TitleCasePipe
    ],
    templateUrl: './home.component.html'
})
export class HomeComponent {

  date: Date = new Date()
  form: FormGroup<HomeForm>

  $result?: Observable<CaculateDateResponse>

  timezoneDropdownData = {
    items: [] as TimezoneResponse[],
    page: 0,
    size: 10,
    totalPage: 0,
    options: {
      showLoader: false,
      lazy: true,
      onLazyLoad: this.onLazyLoadTimezone.bind(this)
    }
  }

  constructor(
    private readonly _formBuilder: NonNullableFormBuilder,
    private readonly _timezoneService: TimezoneService,
    private readonly _destroyRef:	DestroyRef,
    private readonly _changeDetectorRef: ChangeDetectorRef,
  ) {
    this.form = this._formBuilder.group<HomeForm>({
      dateSearch: this._formBuilder.control(undefined, Validators.required),
      timezone: this._formBuilder.control(undefined, Validators.required)
    })

    this._timezoneService.getAllTimezones(this.timezoneDropdownData.page, this.timezoneDropdownData.size)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(data => {
        this.timezoneDropdownData.items =  data.content;
        this.timezoneDropdownData.totalPage = data.totalPages;
      });
  }

  onLazyLoadTimezone(event: any) {
    const needLoadData = event.first + 5 < this.timezoneDropdownData.items.length
    const endData = !(this.timezoneDropdownData.page < this.timezoneDropdownData.totalPage-1)
    if(!needLoadData || endData) {
      return;
    }

    this._timezoneService.getAllTimezones(++this.timezoneDropdownData.page, this.timezoneDropdownData.size)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(data => {
          this.timezoneDropdownData.items.push(...data.content);
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
    const form = {
      date: transformToUTCDate(this.form.controls.dateSearch.value!!),
      timezoneId: this.form.controls.timezone.value!!.id
    }
    this.$result = this._timezoneService.calculateDate(form)
  }

  protected readonly ADMIN_PATH = ADMIN_PATH;
  protected readonly TIMEZONE_PATH = TIMEZONE_PATH;
}
