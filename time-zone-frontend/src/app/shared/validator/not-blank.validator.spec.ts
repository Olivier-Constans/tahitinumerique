import { FormControl } from '@angular/forms';
import { notBlank } from './not-blank.validator';

describe('notBlank', () => {
  it.each([undefined, null, '', '   '])('refuse %j', (value) => {
    expect(notBlank(new FormControl(value))).toEqual({ required: true });
  });

  it('accepte une valeur contenant du texte', () => {
    expect(notBlank(new FormControl(' Tahiti '))).toBeNull();
  });
});
