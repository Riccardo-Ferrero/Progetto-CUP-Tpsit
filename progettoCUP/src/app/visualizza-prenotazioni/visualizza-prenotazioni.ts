import { ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'visualizza-prenotazioni',
  imports: [RouterModule],
  templateUrl: './visualizza-prenotazioni.html',
  styleUrl: './visualizza-prenotazioni.css',
})
export class VisualizzaPrenotazioni {
  prenotazioni: any[] = [];

  constructor(private cdr: ChangeDetectorRef, private router: Router) {
    this.getPrenotazioniPaziente();
  }

  async getPrenotazioniPaziente() {
    try {
      const ris = await fetch('http://localhost:8081/prenotazioniPaziente', {
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

    localStorage.setItem('idPrenotazionePagamento', String(id));
    this.router.navigate(['/pagamento']);
  }

}
