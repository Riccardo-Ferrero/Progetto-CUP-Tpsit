import { ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ModalConferma } from '../modal-conferma/modal-conferma';

@Component({
  selector: 'visualizza-prenotazioni',
  imports: [RouterModule, ModalConferma],
  templateUrl: './visualizza-prenotazioni.html',
  styleUrl: './visualizza-prenotazioni.css',
})
export class VisualizzaPrenotazioni {
  prenotazioni: any[] = [];
  mostraModalConferma: boolean = false;
  mostraModalConfermaPagamento: boolean = false;
  idPrenotazioneDaAnnullare: number = 0;
  idPrenotazioneDaPagare: number = 0;
  isAdmin: boolean = false;
  filtroStato: 'tutte' | 'attive' | 'annullate' = 'tutte';

  constructor(private cdr: ChangeDetectorRef, private router: Router) {
    this.getPrenotazioniPaziente();
  }

  async getPrenotazioniPaziente() {
    try {
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

      const ris = await fetch('http://localhost:8081/prenotazioni', {
        method: 'GET',
        credentials: 'include'
      });

      const risJson = await ris.json();

      if (ris.status === 401) {
        this.router.navigate(['/login']);
        return;
      }

      this.prenotazioni = risJson?.result === 'success' && Array.isArray(risJson?.prenotazioni)
        ? risJson.prenotazioni
        : [];

      this.cdr.detectChanges();
    } catch (err) {
      console.error('Impossibile recuperare le prenotazioni del paziente', err);
      this.prenotazioni = [];
      this.cdr.detectChanges();
    }
  }

  isPrenotazioneAnnullata(prenotazione: any): boolean {
    return String(prenotazione?.ValPrenotazione || '').trim() !== '';
  }

  isPrenotazionePagata(prenotazione: any): boolean {
    return String(prenotazione?.Pagata || '').toUpperCase() === 'S';
  }

  impostaFiltroStato(filtro: 'tutte' | 'attive' | 'annullate') {
    this.filtroStato = filtro;
  }

  isPrenotazioneVisibileConFiltro(prenotazione: any): boolean {
    if (this.filtroStato === 'attive') {
      return !this.isPrenotazioneAnnullata(prenotazione);
    }

    if (this.filtroStato === 'annullate') {
      return this.isPrenotazioneAnnullata(prenotazione);
    }

    return true;
  }

  getPrenotazioniFiltrate(): any[] {
    return this.prenotazioni.filter((prenotazione) => this.isPrenotazioneVisibileConFiltro(prenotazione));
  }

  getStatoPrenotazione(prenotazione: any): string {
    if (this.isPrenotazioneAnnullata(prenotazione)) {
      return 'Annullata';
    }

    if (this.isPrenotazionePagata(prenotazione)) {
      return 'Pagata';
    }

    return 'Da pagare';
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

  getTitoloDottore(prenotazione: any): string {
    return String(prenotazione?.GenereDottore || '').toUpperCase() === 'F' ? 'Dott.ssa' : 'Dott.';
  }

  onPagaPrenotazione(idPrenotazione: number) {
    const id = Number(idPrenotazione || 0);
    if (!id) {
      return;
    }

    if (this.isAdmin) {
      this.idPrenotazioneDaPagare = id;
      this.mostraModalConfermaPagamento = true;
      return;
    }

    localStorage.setItem('idPrenotazionePagamento', String(id));
    this.router.navigate(['/pagamento']);
  }
  
  async onModificaClick(idPrenotazione: number) {
    const id = Number(idPrenotazione || 0);
    if (!id) {
      return;
    }

    localStorage.setItem('idPrenotazioneModifica', String(id));
    this.router.navigate(['/modifica-prenotazione']);
  }

  onAnnullaPrenotazione(idPrenotazione: number) {
    const id = Number(idPrenotazione || 0);
    if (!id) {
      return;
    }

    this.idPrenotazioneDaAnnullare = id;
    this.mostraModalConferma = true;
    this.cdr.detectChanges();
  }

  async onRipristinaPrenotazione(idPrenotazione: number) {
    const id = Number(idPrenotazione || 0);
    if (!id || !this.isAdmin) {
      return;
    }

    try {
      const risposta = await fetch('http://localhost:8081/ripristinaPrenotazione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPrenotazione: id }),
        credentials: 'include'
      });

      if (risposta.status === 401) {
        this.router.navigate(['/login']);
        return;
      }

      const rispostaJson = await risposta.json();
      if (risposta.ok && rispostaJson?.result === 'success') {
        this.getPrenotazioniPaziente();
        return;
      }

      console.error('Errore risposta /ripristinaPrenotazione', rispostaJson);
    } catch (err) {
      console.error('Impossibile ripristinare la prenotazione', err);
    }
  }

  async onRispostaModalConferma(haConfermato: boolean) {
    this.mostraModalConferma = false;

    if (!haConfermato || !this.idPrenotazioneDaAnnullare) {
      this.idPrenotazioneDaAnnullare = 0;
      return;
    }

    const id = this.idPrenotazioneDaAnnullare;
    this.idPrenotazioneDaAnnullare = 0;

    try {
      const risposta = await fetch('http://localhost:8081/annullaPrenotazione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPrenotazione: id }),
        credentials: 'include'
      });

      if (risposta.status === 401) {
        this.router.navigate(['/login']);
        return;
      }

      const rispostaJson = await risposta.json();
      if (risposta.ok && rispostaJson?.result === 'success') {
        localStorage.removeItem('idPrenotazioneModifica');
        localStorage.removeItem('idPrenotazionePagamento');
        this.getPrenotazioniPaziente();
        return;
      }

      console.error('Errore risposta /annullaPrenotazione', rispostaJson);
    } catch (err) {
      console.error('Impossibile annullare la prenotazione', err);
    }
  }

  async onRispostaModalConfermaPagamento(haConfermato: boolean) {
    this.mostraModalConfermaPagamento = false;

    if (!haConfermato || !this.idPrenotazioneDaPagare) {
      this.idPrenotazioneDaPagare = 0;
      return;
    }

    const id = this.idPrenotazioneDaPagare;
    this.idPrenotazioneDaPagare = 0;

    try {
      const risposta = await fetch('http://localhost:8081/pagaPrenotazione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPrenotazione: id }),
        credentials: 'include'
      });

      if (risposta.status === 401) {
        this.router.navigate(['/login']);
        return;
      }

      const rispostaJson = await risposta.json();
      if (risposta.ok && rispostaJson?.result === 'success') {
        this.getPrenotazioniPaziente();
        this.cdr.detectChanges();
        return;
      }

      console.error('Errore risposta /pagaPrenotazione', rispostaJson);
    } catch (err) {
      console.error('Impossibile contrassegnare come pagata la prenotazione', err);
    }
  }
}
