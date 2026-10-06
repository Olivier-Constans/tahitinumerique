import {ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input} from '@angular/core';
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
import {catchError, EMPTY} from "rxjs";

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
    templateUrl: './timezone-edit.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimezoneEditComponent {

  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _timezoneService = inject(TimezoneService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);

  protected readonly ADMIN_PATH = ADMIN_PATH;

  readonly optionsOffsetUTC = OffsetUTC.options;

  // Alimenté par le resolver de la route via withComponentInputBinding (absent en création)
  readonly data = input<TimezoneResponse>();

  readonly form: FormGroup<TimezoneForm> = this._formBuilder.group({
    label: this._formBuilder.control<string | undefined>(undefined, Validators.required),
    offsetUTC: this._formBuilder.control<OffsetUTC | undefined>(undefined, Validators.required)
  });

  constructor() {
    // Rejoué à chaque changement de data (le composant est réutilisé entre deux :id)
    effect(() => {
      const data = this.data();
      if (data) {
        this.form.reset({label: data.label, offsetUTC: data.offsetUTC});
      }
    });
  }

  onSubmit(){
    if(this.form.invalid) {
      return;
    }

    const form = {
      label : this.form.controls.label.value!,
      offsetUTC: this.form.controls.offsetUTC.value!
    }

    const data = this.data();
    const observable = data ?
      this._timezoneService.updateTimezone(data.id, form) : this._timezoneService.createTimezone(form);

    // En cas d'erreur on reste sur le formulaire, le toast est affiché par l'intercepteur
    observable.pipe(
      takeUntilDestroyed(this._destroyRef),
      catchError(() => EMPTY)
    )
      .subscribe((response) => {
        void this._router.navigate(data ? [".."] : ["..", response.id], {relativeTo: this._route});
      })
  }

}
