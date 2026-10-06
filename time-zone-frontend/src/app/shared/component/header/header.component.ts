import { Component } from '@angular/core';
import {ToolbarModule} from "primeng/toolbar";
import {RouterLink} from "@angular/router";
import {ADMIN_PATH} from "../../../app.routes";
import {Button} from "primeng/button";

@Component({
    selector: 'app-header',
    imports: [
        ToolbarModule,
        RouterLink,
        Button
    ],
    templateUrl: './header.component.html'
})
export class HeaderComponent {

  protected readonly ADMIN_PATH = ADMIN_PATH;
}
