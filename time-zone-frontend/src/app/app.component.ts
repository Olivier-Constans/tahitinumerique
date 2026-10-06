import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HeaderComponent} from "./shared/component/header/header.component";

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, HeaderComponent],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'time-zone-frontend';
}
