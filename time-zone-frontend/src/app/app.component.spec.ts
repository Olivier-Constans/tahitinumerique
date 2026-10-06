import {TestBed} from '@angular/core/testing';
import {provideRouter} from "@angular/router";
import {MessageService} from "primeng/api";
import {AppComponent} from './app.component';

describe('AppComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), MessageService]
    });
  });

  it('affiche le header, la zone de toast et le router-outlet', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('app-header h1')?.textContent).toContain('Fuseaux horaires');
    expect(element.querySelector('p-toast')).not.toBeNull();
    expect(element.querySelector('router-outlet')).not.toBeNull();
  });
});
