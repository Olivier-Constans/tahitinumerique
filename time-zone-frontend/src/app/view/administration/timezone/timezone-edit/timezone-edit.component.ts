import {Component, DestroyRef} from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {TimezoneService} from "../../../../shared/service/timezone.service";
import {TimezoneResponse} from "../../../../shared/model/timezone.model";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {Button} from "primeng/button";
import {OffsetUTC} from "../../../../shared/model/offsetUTC.model";
import {Select} from "primeng/select";
import {InputTextModule} from "primeng/inputtext";
import {ADMIN_PATH} from "../../../../app.routes";

export interface TimezoneForm {
  label: FormControl<string | undefined>
  offsetUTC: FormControl<OffsetUTC | undefined>
}

@Component({
    imports: [
        ReactiveFormsModule,
        Button,
        Select,
        InputTextModule,
        RouterLink
    ],
    templateUrl: './timezone-edit.component.html'
})
export class TimezoneEditComponent {

  protected readonly ADMIN_PATH = ADMIN_PATH;

  readonly optionsOffsetUTC = Object.values(OffsetUTC).filter(k => isNaN(Number(k)));

  data: TimezoneResponse | undefined
  form: FormGroup<TimezoneForm>

  constructor(
    private readonly _formBuilder: NonNullableFormBuilder,
    private readonly _timezoneService: TimezoneService,
    private readonly _destroyRef:	DestroyRef,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
  ) {
    this.data = this._route.snapshot.data['data'];

    this.form = this._formBuilder.group({
      label: this._formBuilder.control<string | undefined>(this.data?.label, Validators.required),
      offsetUTC: this._formBuilder.control<OffsetUTC | undefined>( this.data?.offsetUTC, Validators.required)
    });
  }

  onSubmit(){
    if(this.form.invalid) {
      return;
    }

    var form = {
      label : this.form.controls.label.value!!,
      offsetUTC: this.form.controls.offsetUTC.value!!
    }

    var observable =  this.data ?
      this._timezoneService.updateTimezone(this.data.id, form) : this._timezoneService.createTimezone(form);

    observable.pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((reponse) => this._router.navigate(this.data ? [".."] : ["..", reponse.id], {relativeTo: this._route}))
  }

}
