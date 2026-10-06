import {ComponentFixture, TestBed} from '@angular/core/testing';
import {provideRouter, Router} from "@angular/router";
import {HeaderComponent} from './header.component';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([{path: 'admin', children: []}, {path: '', children: []}])]
    });
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(HeaderComponent);
    await fixture.whenStable();
  });

  function element(): HTMLElement {
    return fixture.nativeElement as HTMLElement;
  }

  it('affiche le titre de l\'application', () => {
    expect(element().querySelector('h1')?.textContent).toBe('Fuseaux horaires');
  });

  it('navigue vers l\'administration', async () => {
    element().querySelector<HTMLButtonElement>('p-button button')!.click();
    await fixture.whenStable();

    expect(router.url).toBe('/admin');
  });

  it('revient à l\'accueil en cliquant sur le logo', async () => {
    await router.navigateByUrl('/admin');

    element().querySelector('img')!.click();
    await fixture.whenStable();

    expect(router.url).toBe('/');
  });
});
