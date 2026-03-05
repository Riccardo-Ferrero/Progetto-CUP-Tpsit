import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CalendarioPrenotazioni } from '../calendario-prenotazioni/calendario-prenotazioni';

@Component({
  selector: 'modifica-prenotazione',
  imports: [CalendarioPrenotazioni, FormsModule],
  templateUrl: './modifica-prenotazione.html',
  styleUrl: './modifica-prenotazione.css',
})
export class ModificaPrenotazione {
  idPrenotazioneModifica: number = 0;
  idDottoreSelezionato: number = 1;
  chiaveSlotSelezionato: string = '';

  nomeDottoreCompleto: string = '-';
  repartoDottore: string = '-';
  pagataLabel: string = 'No';
  validitaLabel: string = 'Valida';
  tipoVisitaSelezionato: string = '';
  tipiVisita: string[] = [
    'Visita specialistica',
    'Prima visita',
    'Visita di controllo',
    'Follow-up',
    'Esame diagnostico',
    'Consulenza',
    'Teleconsulto'
  ];

  constructor(private cdr: ChangeDetectorRef, private router: Router) {
    this.caricaPrenotazioneDaModificare();
  }

  async caricaPrenotazioneDaModificare() {
    const idSalvato = Number(localStorage.getItem('idPrenotazioneModifica') || 0);
    if (!idSalvato) {
      this.router.navigate(['/visualizza-prenotazioni']);
      return;
    }

    this.idPrenotazioneModifica = idSalvato;

    try {
      const ris = await fetch('http://localhost:8081/datiPrenotazione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idPrenotazione: this.idPrenotazioneModifica }),
        credentials: 'include'
      });

      const risJson = await ris.json();

      if (ris.status === 401) {
        this.router.navigate(['/login']);
        return;
      }
      let prenotazione;
      if(risJson.result == 'success') {
        prenotazione = risJson?.prenotazione || null;
      }
      if (!prenotazione) {
        this.router.navigate(['/visualizza-prenotazioni']);
        return;
      }

      this.idDottoreSelezionato = Number(prenotazione?.IDDottore || 1);
      this.nomeDottoreCompleto = `${this.getTitoloDottore(prenotazione)} ${String(prenotazione?.NomeDottore || '').trim()} ${String(prenotazione?.CognomeDottore || '').trim()}`.trim();
      this.repartoDottore = String(prenotazione?.RepartoDottore || '-');
      this.pagataLabel = String(prenotazione?.Pagata || '').toUpperCase() === 'S' ? 'Sì' : 'No';
      this.validitaLabel = String(prenotazione?.ValPrenotazione || '').trim() === '' ? 'Valida' : 'Annullata';
      this.tipoVisitaSelezionato = String(prenotazione?.TipoVisita || '');

      if (this.tipoVisitaSelezionato && !this.tipiVisita.includes(this.tipoVisitaSelezionato)) {
        this.tipiVisita = [this.tipoVisitaSelezionato, ...this.tipiVisita];
      }

      this.cdr.detectChanges();
    } catch (errore) {
      console.error('Errore nel recupero dati prenotazione da modificare', errore);
      this.router.navigate(['/visualizza-prenotazioni']);
    }
  }

  getTitoloDottore(prenotazione: any): string {
    return String(prenotazione?.GenereDottore || '').toUpperCase() === 'F' ? 'Dott.ssa' : 'Dott.';
  }

  onSlotSelezionato(slot: string) {
    this.chiaveSlotSelezionato = slot;
  }
}
