import { Component, signal } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  constructor(private router: Router) {}
  protected readonly title = signal('progettoCUP');

  async onCUPClick() {
    try {
      const risposta = await fetch('http://localhost:8081/utenteSessione', {
        method: 'GET',
        credentials: 'include'
      });

      if (!risposta.ok) {
        this.router.navigate(['/home']);
        return;
      }

      const utente = await risposta.json();
      const isAdmin = String(utente?.amministratore || '').trim().toUpperCase() === 'S';
      this.router.navigate([isAdmin ? '/home-admin' : '/home']);
    } catch {
      this.router.navigate(['/home']);
    }
  }
}
