import { Component, inject } from '@angular/core';
import { Google } from "../../services/google";
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  private googleService = inject(Google);
  protected profile = this.googleService.profile;
}
