import {AbstractControl, ValidationErrors} from "@angular/forms";

// Comme Validators.required, mais refuse aussi une chaîne composée uniquement d'espaces (notBlank côté back)
export function notBlank(control: AbstractControl<string | null | undefined>): ValidationErrors | null {
  return control.value?.trim() ? null : {required: true};
}
