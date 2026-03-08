import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'first-page',
  imports: [RouterModule],
  templateUrl: './first-page.html',
  styleUrl: './first-page.css',
})
export class FirstPage {
  async logout(){
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
      } else {
        console.error('Errore durante il logout:', risJson?.message);
      }
    } catch (err) {
      console.error('Impossibile effettuare il logout', err);
    }
  }
  constructor(private router: Router){
    this.logout();
  }
}
