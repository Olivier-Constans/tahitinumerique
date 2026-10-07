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
import { TimezoneService } from '../../../../shared/service/timezone.service';
import { TimezoneResponse } from '../../../../shared/model/timezone.model';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Button } from 'primeng/button';
import { OffsetUTC } from '../../../../shared/model/offsetUTC.model';
import { Select } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { ADMIN_PATH } from '../../../../app.routes';
import { catchError, EMPTY, finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { Message } from 'primeng/message';
import { notBlank } from '../../../../shared/validator/not-blank.validator';

// Limite imposée par le back (Timezone.LABEL_MAX_LENGTH)
export const LABEL_MAX_LENGTH = 100;

export interface TimezoneForm {
  label: FormControl<string | undefined>;
  offsetUTC: FormControl<OffsetUTC | undefined>;
}

@Component({
  imports: [ReactiveFormsModule, Button, Select, InputTextModule, RouterLink, Message],
  templateUrl: './timezone-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimezoneEditComponent {
  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _timezoneService = inject(TimezoneService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _route = inject(ActivatedRoute);
  private readonly _router = inject(Router);
  private readonly _messageService = inject(MessageService);

  protected readonly ADMIN_PATH = ADMIN_PATH;

  protected readonly LABEL_MAX_LENGTH = LABEL_MAX_LENGTH;

  readonly optionsOffsetUTC = OffsetUTC.options;

  // Alimenté par le resolver de la route via withComponentInputBinding (absent en création)
  readonly data = input<TimezoneResponse>();

  readonly saving = signal(false);

  readonly form: FormGroup<TimezoneForm> = this._formBuilder.group({
    label: this._formBuilder.control<string | undefined>(undefined, [
      notBlank,
      Validators.maxLength(LABEL_MAX_LENGTH),
    ]),
    offsetUTC: this._formBuilder.control<OffsetUTC | undefined>(undefined, Validators.required),
  });

  constructor() {
    // Rejoué à chaque changement de data (le composant est réutilisé entre deux :id)
    effect(() => {
      const data = this.data();
      if (data) {
        this.form.reset({ label: data.label, offsetUTC: data.offsetUTC });
      }
    });
  }

  onSubmit() {
    if (this.form.invalid || this.saving()) {
      return;
    }

    const form = {
      label: this.form.controls.label.value!.trim(),
      offsetUTC: this.form.controls.offsetUTC.value!,
    };

    const data = this.data();
    const observable = data
      ? this._timezoneService.updateTimezone(data.id, form)
      : this._timezoneService.createTimezone(form);

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
          detail: `Fuseau horaire « ${response.label} » ${data ? 'modifié' : 'créé'}.`,
        });
        void this._router.navigate(data ? ['..'] : ['..', response.id], {
          relativeTo: this._route,
        });
      });
  }
}
