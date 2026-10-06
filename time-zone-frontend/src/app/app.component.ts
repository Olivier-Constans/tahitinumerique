import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HeaderComponent} from "./shared/component/header/header.component";
import {Toast} from "primeng/toast";

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, HeaderComponent, Toast],
    templateUrl: './app.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {}
