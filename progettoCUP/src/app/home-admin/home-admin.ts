import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'home-admin',
  imports: [],
  templateUrl: './home-admin.html',
  styleUrl: './home-admin.css',
})
export class HomeAdmin {
  constructor(private router: Router) {
    this.getAmministratore();
  }
  isAdmin: boolean = false;
  async getAmministratore(){
    try{
      const utenteSessioneRis = await fetch('http://localhost:8081/utenteSessione', {
        method: 'GET',
        credentials: 'include'
      });

      if (utenteSessioneRis.status === 401) {
        this.router.navigate(['/login']);
        return;
      }

      const utenteSessioneJson = await utenteSessioneRis.json();
      this.isAdmin = String(utenteSessioneJson?.amministratore || '').trim().toUpperCase() === 'S';
      if(!this.isAdmin){
        this.router.navigate(['/login']);
        return;
      }
    }
    catch (err) {
      console.error('Impossibile recuperare il paziente', err);
    }
  }
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
