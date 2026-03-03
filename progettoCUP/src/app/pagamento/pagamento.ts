import { Component } from '@angular/core';
import { FormsModule,NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'pagamento',
  imports: [FormsModule],
  templateUrl: './pagamento.html',
  styleUrl: './pagamento.css',
})
export class Pagamento {
  constructor(private router: Router) {}
  pagamento = {
    numeroCarta: '',
    nomeIntestatario: '',
    scadenza: '',
    cvv: '',
    circuito: ''
  };
  async onSubmit(f: NgForm) {
    if(f.valid){
      // Logica di pagamento qui
      const risposta = await fetch("http://localhost:8081/pagaPrenotazione", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: 'include',
        body: JSON.stringify({
          idPrenotazione: localStorage.getItem('idPrenotazionePagamento') || '',
        })
      });

      if (risposta.status === 401) {
        this.router.navigate(['/login']);
        return;
      }

      const datiRisposta = await risposta.json();
      if(datiRisposta?.result === 'success'){
        localStorage.removeItem('idPrenotazionePagamento');
        console.log('Pagamento effettuato con successo:', datiRisposta);
        this.router.navigate(['/visualizza-prenotazioni']);
      }
      
    }
  }
}
