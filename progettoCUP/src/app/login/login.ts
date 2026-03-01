import { Component } from '@angular/core';
import { FormsModule,NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'login',
  imports: [FormsModule],
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
      body: JSON.stringify(this.Login)
    });
    const ris = await risposta.json();

    if(ris.result == "success"){
      localStorage.setItem("user", JSON.stringify(ris.idUtente));
      this.router.navigate(['/home']);
    }

  }
}
