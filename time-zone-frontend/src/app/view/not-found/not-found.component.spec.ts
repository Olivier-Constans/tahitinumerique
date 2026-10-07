import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from '../../app.routes';

describe('NotFoundComponent', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
    harness = await RouterTestingHarness.create();
  });

  it("est affiché pour une URL inconnue et propose de revenir à l'accueil", async () => {
    await harness.navigateByUrl('/url/inconnue');

    expect(TestBed.inject(Router).url).toBe('/404');
    const element = harness.routeNativeElement!;
    expect(element.querySelector('h2')?.textContent).toBe('Page introuvable');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/');
  });
});
