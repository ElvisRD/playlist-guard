import { Component } from '@angular/core';
import { Google } from '../../services/google';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  profile = null;
  constructor(
    private googleService: Google
  ) {}

  ngOnInit(){
    this.googleService.profile$.subscribe({
      next: (profile) => {
        if(profile){
          this.profile = profile;
          console.log(profile)
        }
      },
      error: (err) => console.error(err.message)
    })
  }

  loginWithGoogle() {
    this.googleService.authenticateWithGoogle().subscribe({
      next: () => {
        this.googleService.loadProfile()
      },
      error: (err) => console.error(err.message),
    });
  }

  logout() {

  }
}
