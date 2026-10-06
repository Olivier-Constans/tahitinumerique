import { ChangeDetectionStrategy, Component } from '@angular/core';
import {ToolbarModule} from "primeng/toolbar";
import {RouterLink} from "@angular/router";
import {ADMIN_PATH} from "../../../app.routes";
import {Button} from "primeng/button";
import {Tooltip} from "primeng/tooltip";

@Component({
    selector: 'app-header',
    imports: [
        ToolbarModule,
        RouterLink,
        Button,
        Tooltip
    ],
    templateUrl: './header.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderComponent {

  protected readonly ADMIN_PATH = ADMIN_PATH;
}
