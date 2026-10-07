import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { PlaceService } from '../../../../shared/service/place.service';
import {
  formatZoneOffset,
  PLACE_TYPE_LABELS,
  PlaceRequest,
  PlaceResponse,
  PlaceType,
  ZONE_ID,
  ZONE_OFFSET_FIXED,
} from '../../../../shared/model/place.model';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { SelectButton } from 'primeng/selectbutton';
import { InputTextModule } from 'primeng/inputtext';
import { ADMIN_PATH } from '../../../../app.routes';
import { catchError, EMPTY, finalize, map, of, startWith } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Message } from 'primeng/message';
import { notBlank } from '../../../../shared/validator/not-blank.validator';

// Limite imposée par le back (Place.LABEL_MAX_LENGTH)
export const LABEL_MAX_LENGTH = 100;

export interface PlaceForm {
  type: FormControl<PlaceType>;
  label: FormControl<string | undefined>;
  zoneOffset: FormControl<string | undefined>;
  zoneId: FormControl<string | undefined>;
}

@Component({
  imports: [
    ReactiveFormsModule,
    Button,
    Select,
    SelectButton,
    InputTextModule,
    RouterLink,
    Message,
  ],
  templateUrl: './place-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlaceEditComponent {
  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _placeService = inject(PlaceService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _messageService = inject(MessageService);

  protected readonly ADMIN_PATH = ADMIN_PATH;
  protected readonly ZONE_ID = ZONE_ID;

  protected readonly LABEL_MAX_LENGTH = LABEL_MAX_LENGTH;

  readonly optionsType = PlaceType.options.map((value) => ({
    value,
    label: PLACE_TYPE_LABELS[value],
  }));

  // En cas d'échec, le toast est affiché par l'intercepteur et la liste reste vide
  readonly optionsZoneOffset = toSignal(
    this._placeService.getAllZoneOffsets().pipe(
      map((zoneOffsets) => zoneOffsets.map((value) => ({ value, label: formatZoneOffset(value) }))),
      catchError(() => of([])),
    ),
    { initialValue: [] },
  );

  readonly optionsZoneId = toSignal(
    this._placeService.getAllZoneIds().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  // Alimenté par le resolver de la route via withComponentInputBinding (absent en création)
  readonly data = input<PlaceResponse>();

  readonly saving = signal(false);

  readonly form: FormGroup<PlaceForm> = this._formBuilder.group({
    type: this._formBuilder.control<PlaceType>(ZONE_OFFSET_FIXED),
    label: this._formBuilder.control<string | undefined>(undefined, [
      notBlank,
      Validators.maxLength(LABEL_MAX_LENGTH),
    ]),
    zoneOffset: this._formBuilder.control<string | undefined>(undefined, Validators.required),
    zoneId: this._formBuilder.control<string | undefined>(undefined, Validators.required),
  });

  readonly type = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.value,
  });

  constructor() {
    // Seul le champ du type choisi est actif : l'autre est exclu de la validation et du formulaire envoyé
    this.form.controls.type.valueChanges
      .pipe(startWith(this.form.controls.type.value), takeUntilDestroyed())
      .subscribe((type) => {
        const [enabled, disabled] =
          type === ZONE_ID
            ? [this.form.controls.zoneId, this.form.controls.zoneOffset]
            : [this.form.controls.zoneOffset, this.form.controls.zoneId];
        enabled.enable({ emitEvent: false });
        disabled.disable({ emitEvent: false });
      });

    // Rejoué à chaque changement de data (le composant est réutilisé entre deux :id)
    effect(() => {
      const data = this.data();
      if (data) {
        this.form.reset({
          type: data.type,
          label: data.label,
          zoneOffset: data.type === ZONE_OFFSET_FIXED ? data.zoneOffset : undefined,
          zoneId: data.type === ZONE_ID ? data.zoneId : undefined,
        });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid || this.saving()) {
      return;
    }

    const label = this.form.controls.label.value!.trim();
    const form: PlaceRequest =
      this.form.controls.type.value === ZONE_ID
        ? { type: ZONE_ID, label, zoneId: this.form.controls.zoneId.value! }
        : { type: ZONE_OFFSET_FIXED, label, zoneOffset: this.form.controls.zoneOffset.value! };

    const data = this.data();
    const observable = data
      ? this._placeService.updatePlace(data.id, form)
      : this._placeService.createPlace(form);

    // En cas d'erreur on reste sur le formulaire, le toast est affiché par l'intercepteur
    this.saving.set(true);
    observable
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        catchError(() => EMPTY),
        finalize(() => this.saving.set(false)),
      )
      .subscribe((response) => {
        this._messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: `Lieu « ${response.label} » ${data ? 'modifié' : 'créé'}.`,
        });
        void this._router.navigate(data ? ['..'] : ['..', response.id], {
          relativeTo: this._route,
        });
      });
  }
}
