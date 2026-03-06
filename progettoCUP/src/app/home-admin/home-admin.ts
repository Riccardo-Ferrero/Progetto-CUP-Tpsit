import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'home-admin',
  imports: [],
  templateUrl: './home-admin.html',
  styleUrl: './home-admin.css',
})
export class HomeAdmin {
  constructor(private router: Router) {}

  async onLogoutClick() {
    try {
      const risposta = await fetch('http://localhost:8081/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const risJson = await risposta.json();
      if (risJson.result === 'success') {
        localStorage.removeItem('idPrenotazionePagamento');
        localStorage.removeItem('idPrenotazioneModifica');
        this.router.navigate(['/']);
      } else {
        console.error('Errore durante il logout:', risJson?.message);
      }
    } catch (err) {
      console.error('Impossibile effettuare il logout', err);
    }
  }
}
