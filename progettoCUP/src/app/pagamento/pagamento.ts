import { Component } from '@angular/core';
import { FormsModule,NgForm } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'pagamento',
  imports: [FormsModule, RouterLink],
  templateUrl: './pagamento.html',
  styleUrl: './pagamento.css',
})
export class Pagamento {
  totaleDaPagare: number = 0;

  constructor(private router: Router) {
    const prezzoSalvato = this.parsePrezzo(localStorage.getItem('prezzoPrenotazionePagamento'));
    this.totaleDaPagare = Number.isFinite(prezzoSalvato) ? prezzoSalvato : 0;

    if (this.totaleDaPagare <= 0) {
      this.caricaTotaleDaPrenotazione();
    }
  }
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
        this.pulisciStoragePagamento();
        console.log('Pagamento effettuato con successo:', datiRisposta);
        this.router.navigate(['/visualizza-prenotazioni']);
      }
      
    }
  }

  getTotaleFormattato(): string {
    return this.totaleDaPagare.toLocaleString('it-IT', {
      style: 'currency',
      currency: 'EUR'
    });
  }

  private pulisciStoragePagamento() {
    localStorage.removeItem('idPrenotazionePagamento');
    localStorage.removeItem('prezzoPrenotazionePagamento');
  }

  private parsePrezzo(valore: string | null): number {
    const testo = String(valore || '').trim();
    if (!testo) {
      return 0;
    }

    const numero = Number(testo.replace(',', '.'));
    return Number.isFinite(numero) ? numero : 0;
  }

  private async caricaTotaleDaPrenotazione() {
    const idPrenotazione = Number(localStorage.getItem('idPrenotazionePagamento') || '0');
    if (!idPrenotazione) {
      return;
    }

    try {
      const ris = await fetch('http://localhost:8081/datiPrenotazione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idPrenotazione })
      });

      if (ris.status === 401) {
        this.router.navigate(['/login']);
        return;
      }

      const risJson = await ris.json();
      const prezzo = this.parsePrezzo(
        String(
          risJson?.prenotazione?.PrezzoVisita ??
          risJson?.prenotazione?.prezzoVisita ??
          '0'
        )
      );

      if (prezzo > 0) {
        this.totaleDaPagare = prezzo;
        localStorage.setItem('prezzoPrenotazionePagamento', String(prezzo));
      }
    } catch (err) {
      console.error('Impossibile recuperare il prezzo della prenotazione', err);
    }
  }
}
