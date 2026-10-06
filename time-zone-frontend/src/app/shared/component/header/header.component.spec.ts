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

  it('affiche le titre de l\'application', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Fuseaux horaires');
  });

  it('navigue vers l\'administration', async () => {
    fixture.nativeElement.querySelector('p-button button').click();
    await fixture.whenStable();

    expect(router.url).toBe('/admin');
  });

  it('revient à l\'accueil en cliquant sur le logo', async () => {
    await router.navigateByUrl('/admin');

    fixture.nativeElement.querySelector('img').click();
    await fixture.whenStable();

    expect(router.url).toBe('/');
  });
});
