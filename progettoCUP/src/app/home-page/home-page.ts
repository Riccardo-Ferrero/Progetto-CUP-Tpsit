import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'home-page',
  imports: [RouterModule],
  templateUrl: './home-page.html',
  styleUrl: './home-page.css',
})
export class HomePage {
  prossimiAppuntamenti: any[] = [];
  prenotazioniUrgentiDaPagare: any[] = [];
  appuntamentiProssimi30gg: number = 0;
  prenotazioniDaPagare: number = 0;
  importoInSospeso: number = 0;
  messaggioSuccessoPrenotazione: string = '';
  nomePaziente: string = '';
  cognomePaziente: string = '';
  constructor(private cdr: ChangeDetectorRef, private router: Router) {
    this.mostraAlertPrenotazioneSePresente();
    this.caricaDashboard();
  }

  async caricaDashboard() {
    const utenteInSessione = await this.getUtenteSessione();
    if (!utenteInSessione) {
      this.router.navigate(['/login']);
      return;
    }

    this.getNextThreeAppointments();
    this.getCountNextMothAppointments();
    this.getCountToPayAppointments();
    this.getTotalToPay();
    this.getRecentToPay();
  }

  async getUtenteSessione(): Promise<boolean> {
    try {
      const ris = await fetch('http://localhost:8081/utenteSessione', {
        method: 'GET',
        credentials: 'include'
      });

      const risJson = await ris.json();

      if (!ris.ok || risJson?.result !== 'success') {
        return false;
      }

      this.nomePaziente = risJson?.nome || '';
      this.cognomePaziente = risJson?.cognome || '';
      this.cdr.detectChanges();
      return true;
    } catch (err) {
      console.error('Impossibile recuperare utente in sessione', err);
      return false;
    }
  }

  mostraAlertPrenotazioneSePresente() {
    const messaggio = localStorage.getItem('alertPrenotazioneSuccesso') || '';
    if (!messaggio) {
      return;
    }

    this.messaggioSuccessoPrenotazione = messaggio;
    localStorage.removeItem('alertPrenotazioneSuccesso');

    setTimeout(() => {
      this.messaggioSuccessoPrenotazione = '';
      this.cdr.detectChanges();
    }, 2000);
  }

  async getRecentToPay() {
    try {
      const ris = await fetch('http://localhost:8081/recentToPay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include'
      });

      const risJson = await ris.json();
      this.prenotazioniUrgentiDaPagare = risJson?.result === 'success' && Array.isArray(risJson?.prenotazioni)
        ? risJson.prenotazioni
        : [];
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Impossibile recuperare le prenotazioni urgenti da pagare', err);
      this.prenotazioniUrgentiDaPagare = [];
      this.cdr.detectChanges();
    }
  }

  async getCountToPayAppointments() {
    try {
      const ris = await fetch('http://localhost:8081/countToPayAppointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include'
      });

      const risJson = await ris.json();
      this.prenotazioniDaPagare = risJson?.result === 'success' ? Number(risJson?.count ?? 0) : 0;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Impossibile recuperare il conteggio delle prenotazioni da pagare', err);
      this.prenotazioniDaPagare = 0;
      this.cdr.detectChanges();
    }
  }

  async getTotalToPay() {
    try {
      const ris = await fetch('http://localhost:8081/totalToPay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include'
      });

      const risJson = await ris.json();
      this.importoInSospeso = risJson?.result === 'success' ? Number(risJson?.total ?? 0) : 0;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Impossibile recuperare il totale da pagare', err);
      this.importoInSospeso = 0;
      this.cdr.detectChanges();
    }
  }

  async getCountNextMothAppointments() {
    try {
      const ris = await fetch('http://localhost:8081/countNextMothAppointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include'
      });

      const risJson = await ris.json();
      this.appuntamentiProssimi30gg = risJson?.result === 'success' ? Number(risJson?.count ?? 0) : 0;
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Impossibile recuperare il conteggio appuntamenti prossimi 30 giorni', err);
      this.appuntamentiProssimi30gg = 0;
      this.cdr.detectChanges();
    }
  }

  async getNextThreeAppointments() {
    try {
      const ris = await fetch('http://localhost:8081/nextThreeAppointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        credentials: 'include'
      });

      const risJson = await ris.json();
      this.prossimiAppuntamenti = risJson?.result === 'success' && Array.isArray(risJson?.prenotazioni)
        ? risJson.prenotazioni
        : [];
      this.cdr.detectChanges();
    } catch (err) {
      console.error('Impossibile recuperare i prossimi appuntamenti', err);
      this.prossimiAppuntamenti = [];
      this.cdr.detectChanges();
    }
  }

  onPagaPrenotazione(idPrenotazione: number) {
    const id = Number(idPrenotazione || 0);
    if (!id) {
      return;
    }

    localStorage.setItem('idPrenotazionePagamento', String(id));
    this.router.navigate(['/pagamento']);
  }

  getDay(dataOra: string): string {
    const data = new Date(dataOra);
    return String(data.getDate()).padStart(2, '0');
  }

  getMonthYear(dataOra: string): string {
    const data = new Date(dataOra);
    const mese = String(data.getMonth() + 1).padStart(2, '0');
    const anno = data.getFullYear();
    return `${mese}/${anno}`;
  }

  getTime(dataOra: string): string {
    const data = new Date(dataOra);
    const ore = String(data.getHours()).padStart(2, '0');
    const minuti = String(data.getMinutes()).padStart(2, '0');
    return `${ore}:${minuti}`;
  }

  getDate(dataOra: string): string {
    const data = new Date(dataOra);
    const giorno = String(data.getDate()).padStart(2, '0');
    const mese = String(data.getMonth() + 1).padStart(2, '0');
    const anno = data.getFullYear();
    return `${giorno}/${mese}/${anno}`;
  }

  formatEuro(importo: number): string {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(importo || 0);
  }
}
