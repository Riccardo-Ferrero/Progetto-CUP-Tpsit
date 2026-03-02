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
  }
  Prenotazione = {
    reparto: '',
    dottore: '',
    tipoVisita: ''
  };

  reparti: any[] = [];
  dottoriReparto: any[] = [];
  async getReparti(){
    const risposta = await fetch('http://localhost:8081/reparti');
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
