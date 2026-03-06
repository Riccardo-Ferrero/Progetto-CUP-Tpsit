import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CalendarioPrenotazioni } from '../calendario-prenotazioni/calendario-prenotazioni';
import { ModalConferma } from '../modal-conferma/modal-conferma';

@Component({
  selector: 'modifica-prenotazione',
  imports: [CalendarioPrenotazioni, FormsModule, ModalConferma],
  templateUrl: './modifica-prenotazione.html',
  styleUrl: './modifica-prenotazione.css',
})
export class ModificaPrenotazione {
  idPrenotazioneModifica: number = 0;
  idDottoreSelezionato: number = 1;
  chiaveSlotSelezionato: string = '';
  invioModificaInCorso: boolean = false;
  isAdmin: boolean = false;

  nomeDottoreCompleto: string = '-';
  repartoDottore: string = '-';
  pagataLabel: string = 'No';
  validitaLabel: string = 'Valida';
  tipoVisitaSelezionato: string = '';
  mostraModalConfermaAnnulla: boolean = false;
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
    this.getAmministratore();
  }

  async caricaPrenotazioneDaModificare() {
    const idSalvato = Number(localStorage.getItem('idPrenotazioneModifica') || 0);
    if (!idSalvato) {
      console.error("No ID prenotazione in local storage");
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
        console.error("Prenotazione non trovata")
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

  onAnnullaClick() {
    this.mostraModalConfermaAnnulla = true;
  }

  onRispostaModalConferma(haConfermato: boolean) {
    this.mostraModalConfermaAnnulla = false;

    if (!haConfermato) {
      return;
    }

    localStorage.removeItem('idPrenotazioneModifica');
    this.router.navigate(['/visualizza-prenotazioni']);
  }

  async onContinuaModificaClick() {
    if (this.invioModificaInCorso || !this.chiaveSlotSelezionato || !this.idPrenotazioneModifica || !this.tipoVisitaSelezionato) {
      return;
    }

    const dataOraDb = `${this.chiaveSlotSelezionato}:00`;
    this.invioModificaInCorso = true;

    try {
      const risposta = await fetch('http://localhost:8081/modificaPrenotazione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idPrenotazione: this.idPrenotazioneModifica,
          dataOra: dataOraDb,
          tipoVisita: this.tipoVisitaSelezionato
        }),
        credentials: 'include'
      });

      if (risposta.status === 401) {
        this.router.navigate(['/login']);
        return;
      }

      const testoRisposta = await risposta.text();
      let rispostaJson: any = null;

      try {
        rispostaJson = testoRisposta ? JSON.parse(testoRisposta) : null;
      } catch {
        rispostaJson = null;
      }

      if (risposta.ok && rispostaJson?.result === 'success') {
        localStorage.removeItem('idPrenotazioneModifica');
        localStorage.setItem('alertPrenotazioneSuccesso', 'La prenotazione è stata modificata con successo');
        if(this.isAdmin){
          this.router.navigate(['/home-admin']);
        }
        else{
          this.router.navigate(['/home']);
        }
        
        return;
      }

      console.error('Risposta non valida da /modificaPrenotazione', risposta.status, testoRisposta);
    } catch (errore) {
      console.error('Errore durante modifica prenotazione', errore);
    } finally {
      this.invioModificaInCorso = false;
    }
  }
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
    }
    catch (err) {
      console.error('Impossibile recuperare il paziente', err);
    }
  }
}
