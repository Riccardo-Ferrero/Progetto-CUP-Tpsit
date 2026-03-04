import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'nuova-prenotazione-calendario',
  imports: [FormsModule],
  templateUrl: './nuova-prenotazione-calendario.html',
  styleUrl: './nuova-prenotazione-calendario.css',
})
export class NuovaPrenotazioneCalendario {


  constructor(private cdr: ChangeDetectorRef, private router: Router) {
    
  }

  
  async onContinua() {
    if (!this.haSlotSelezionato()) {
      return;
    }

    const idUtenteSessione = await this.getIdUtenteSessione();
    if (!idUtenteSessione) {
      this.router.navigate(['/login']);
      return;
    }

    const prenotazioneSalvata = localStorage.getItem('prenotazione');

    if (!prenotazioneSalvata) {
      return;
    }

    let prenotazione: any = null;
    try {
      prenotazione = JSON.parse(prenotazioneSalvata);
    } catch {
      return;
    }

    const idDottore = Number(prenotazione?.dottore || 0);
    const tipoVisita = String(prenotazione?.tipoVisita || '').trim();

    if (!idDottore || !tipoVisita) {
      return;
    }

    const dataOraDb = `${this.chiaveSlotSelezionato}:00`;
    
    try {
      const risposta = await fetch('http://localhost:8081/addPrenotazione', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idUtente: idUtenteSessione,
          idDottore,
          dataOra: dataOraDb,
          tipoVisita,
        }),
        credentials: 'include'
      });

      const rispostaJson = await risposta.json();
      if (risposta.ok && rispostaJson?.result === 'success') {
        localStorage.setItem('alertPrenotazioneSuccesso', 'La prenotazione è stata aggiunta con successo');
        localStorage.removeItem('prenotazione');
        this.router.navigate(['/home']);
      }
    } catch (errore) {
      console.error('Errore durante inserimento prenotazione', errore);
    }
  }

  ottieniIdSlot(data: Date, ora: string): string {
    const chiaveSlot = this.creaChiaveSlot(data, ora)
      .replace(' ', '-')
      .replace(':', '-');

    return `slot-${chiaveSlot}`;
  }

  ottieniChiaveSlot(data: Date, ora: string): string {
    return this.creaChiaveSlot(data, ora);
  }

  private async getIdUtenteSessione(): Promise<number> {
    try {
      const ris = await fetch('http://localhost:8081/utenteSessione', {
        method: 'GET',
        credentials: 'include'
      });

      const risJson = await ris.json();
      if (!ris.ok || risJson?.result !== 'success') {
        return 0;
      }

      return Number(risJson?.idUtente || 0);
    } catch {
      return 0;
    }
  }

 

}
