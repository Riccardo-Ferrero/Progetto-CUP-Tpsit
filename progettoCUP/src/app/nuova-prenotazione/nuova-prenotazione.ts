import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { FormsModule,NgForm } from '@angular/forms';

@Component({
  selector: 'nuova-prenotazione',
  imports: [RouterModule, FormsModule],
  templateUrl: './nuova-prenotazione.html',
  styleUrl: './nuova-prenotazione.css',
})
export class NuovaPrenotazione {
  constructor(private cdr: ChangeDetectorRef, private router: Router) {
    this.getReparti();
    this.getAmministratore();
  }
  Prenotazione = {
    paziente: '',
    reparto: '',
    dottore: '',
    tipoVisita: ''
  };
  isAdmin: boolean = false;
  reparti: any[] = [];
  dottoriReparto: any[] = [];
  idUtente: string = "";
  pazienti: any[] = [];

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
      this.idUtente = utenteSessioneJson.idUtente;
      if(this.isAdmin){
        this.getPazienti();
      }
    }
    catch (err) {
      console.error('Impossibile recuperare il paziente', err);
      this.cdr.detectChanges();
    }
    
  }

  async getPazienti(){
    const risposta = await fetch('http://localhost:8081/pazienti', {
      method: 'GET',
      credentials: 'include'
    });
    const data = await risposta.json();
    this.pazienti = data.pazienti;
    console.log(this.reparti);
    this.cdr.detectChanges();
  }

  async getReparti(){
    const risposta = await fetch('http://localhost:8081/reparti',{
      method: 'GET',
      credentials: 'include'
    });
    const data = await risposta.json();
    this.reparti = data;
    console.log(this.reparti);
    this.cdr.detectChanges();
  }
  async onRepartoChange(event: any) {
    const repartoId = event.target.value;
    this.Prenotazione.dottore = '';
    this.dottoriReparto = [];

    if(repartoId != ''){
      const risposta = await fetch(`http://localhost:8081/dottoriReparto?repartoId=${repartoId}`);
      const data = await risposta.json();
      this.dottoriReparto = Array.isArray(data?.dottori) ? data.dottori : [];
      this.cdr.detectChanges();
    }

    this.cdr.detectChanges();
  }

  onSubmit(form: NgForm) {
    if (form.valid) {
      localStorage.setItem('prenotazione', JSON.stringify(this.Prenotazione));
      this.router.navigate(['/nuova-prenotazione-calendario']);
    }
  }
}
