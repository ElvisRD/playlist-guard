import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  openDialogLogin = false;

  constructor() {}

  login() {
    this.openDialogLogin = true;
  }
  
}
