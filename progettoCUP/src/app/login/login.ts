import { Component } from '@angular/core';
import { FormsModule,NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  Login = {
    email: '',
    password: ''
  };

  constructor(private router: Router) {}

  async onSubmit(f: NgForm) {
    let risposta = await fetch("http://localhost:8081/login", {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(this.Login),
      credentials: 'include'
    });
    const ris = await risposta.json();

    if(ris.result == "success"){
      const isAdmin = String(ris?.amministratore || '').trim().toUpperCase() === 'S';
      this.router.navigate([isAdmin ? '/home-admin' : '/home']);
    }

  }
}
