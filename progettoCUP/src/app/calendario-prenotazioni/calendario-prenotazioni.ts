import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'calendario-prenotazioni',
  imports: [FormsModule],
  templateUrl: './calendario-prenotazioni.html',
  styleUrl: './calendario-prenotazioni.css',
})
export class CalendarioPrenotazioni implements OnInit, OnChanges {
  @Input() idDottore: number = 0;
  @Output() slotSelezionato = new EventEmitter<string>();

  giorniSettimana: { data: Date; nome: string; numero: string; mese: string }[] = [];
  orariCalendario: string[] = [];
  descrizioneSettimana: string = '';
  dataRicercaCalendario: string = '';
  dataMinimaRicerca: string = '';

  private chiaviSlotOccupati: Set<string> = new Set<string>();
  private chiaveSlotSelezionato: string = '';
  private dataOggi: Date = this.ottieniInizioGiorno(new Date());
  private lunediSettimanaVisualizzata: Date = this.ottieniLunediSettimana(new Date());

  constructor(private cdr: ChangeDetectorRef) {
    this.dataMinimaRicerca = this.formattaDataPerInput(this.dataOggi);
  }

  ngOnInit() {
    this.inizializzaCalendario();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (!changes['idDottore'] || changes['idDottore'].firstChange) {
      return;
    }

    this.resetSelezioneSlot();
    await this.caricaSlotOccupatiDottore();
    this.cdr.detectChanges();
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

  async inizializzaCalendario() {
    this.dataMinimaRicerca = this.formattaDataPerInput(this.dataOggi);
    this.orariCalendario = this.creaOrariCalendario();
    this.impostaSettimanaCorrente();
    await this.caricaSlotOccupatiDottore();
    this.cdr.detectChanges();
  }

  creaOrariCalendario(): string[] {
    const orari: string[] = [];

    for (let ora = 9; ora <= 17; ora++) {
      orari.push(`${String(ora).padStart(2, '0')}:00`);
    }

    return orari;
  }

  impostaSettimanaCorrente() {
    const oggi = new Date();
    this.lunediSettimanaVisualizzata = this.ottieniLunediSettimana(oggi);
    this.impostaSettimana(this.lunediSettimanaVisualizzata);
  }

  vaiSettimanaSuccessiva() {
    const nuovoLunedi = new Date(this.lunediSettimanaVisualizzata);
    nuovoLunedi.setDate(nuovoLunedi.getDate() + 7);

    this.lunediSettimanaVisualizzata = nuovoLunedi;
    this.impostaSettimana(this.lunediSettimanaVisualizzata);
    this.resetSelezioneSlot();
  }

  vaiSettimanaPrecedente() {
    if (!this.puoAndareSettimanaPrecedente()) {
      return;
    }

    const nuovoLunedi = new Date(this.lunediSettimanaVisualizzata);
    nuovoLunedi.setDate(nuovoLunedi.getDate() - 7);

    this.lunediSettimanaVisualizzata = nuovoLunedi;
    this.impostaSettimana(this.lunediSettimanaVisualizzata);
    this.resetSelezioneSlot();
  }

  puoAndareSettimanaPrecedente(): boolean {
    const lunediSettimanaPrecedente = new Date(this.lunediSettimanaVisualizzata);
    lunediSettimanaPrecedente.setDate(lunediSettimanaPrecedente.getDate() - 7);

    return !this.isSettimanaConclusa(lunediSettimanaPrecedente);
  }

  vaiADataCalendario() {
    if (!this.dataRicercaCalendario || this.isDataRicercaPassata()) {
      return;
    }

    const dataSelezionata = this.parseDataInput(this.dataRicercaCalendario);
    if (!dataSelezionata) {
      return;
    }

    if (this.ottieniInizioGiorno(dataSelezionata).getTime() < this.dataOggi.getTime()) {
      return;
    }

    this.lunediSettimanaVisualizzata = this.ottieniLunediSettimana(dataSelezionata);
    this.impostaSettimana(this.lunediSettimanaVisualizzata);
    this.resetSelezioneSlot();
  }

  isDataRicercaPassata(): boolean {
    if (!this.dataRicercaCalendario) {
      return false;
    }

    const dataSelezionata = this.parseDataInput(this.dataRicercaCalendario);
    if (!dataSelezionata) {
      return false;
    }

    return this.ottieniInizioGiorno(dataSelezionata).getTime() < this.dataOggi.getTime();
  }

  isDataRicercaValidaPerVaiAData(): boolean {
    return !!this.dataRicercaCalendario && !this.isDataRicercaPassata();
  }

  private isSettimanaConclusa(lunediSettimana: Date): boolean {
    const venerdiSettimana = new Date(lunediSettimana);
    venerdiSettimana.setDate(venerdiSettimana.getDate() + 4);
    venerdiSettimana.setHours(0, 0, 0, 0);

    return venerdiSettimana.getTime() < this.dataOggi.getTime();
  }

  private impostaSettimana(inizioSettimana: Date) {
    const lunediSettimana = new Date(inizioSettimana);
    lunediSettimana.setHours(0, 0, 0, 0);

    this.giorniSettimana = [];
    for (let indice = 0; indice < 5; indice++) {
      const dataGiorno = new Date(lunediSettimana);
      dataGiorno.setDate(lunediSettimana.getDate() + indice);

      this.giorniSettimana.push({
        data: dataGiorno,
        nome: this.ottieniNomeGiorno(dataGiorno),
        numero: String(dataGiorno.getDate()).padStart(2, '0'),
        mese: this.ottieniNomeMeseBreve(dataGiorno),
      });
    }

    const primoGiorno = this.giorniSettimana[0]?.data;
    const ultimoGiorno = this.giorniSettimana[this.giorniSettimana.length - 1]?.data;

    if (primoGiorno && ultimoGiorno) {
      this.descrizioneSettimana = `Settimana ${this.formattaDataBreve(primoGiorno)} - ${this.formattaDataBreve(ultimoGiorno)}`;
    }
  }

  async caricaSlotOccupatiDottore() {
    this.chiaviSlotOccupati.clear();

    if (!this.idDottore) {
      return;
    }

    try {
      const risposta = await fetch('http://localhost:8081/prenotazioniDottore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idDottore: this.idDottore }),
      });

      const rispostaJson = await risposta.json();
      const prenotazioni = Array.isArray(rispostaJson?.prenotazioni) ? rispostaJson.prenotazioni : [];

      for (const prenotazione of prenotazioni) {
        if (this.isPrenotazioneAnnullata(prenotazione)) {
          continue;
        }

        const dataOraPrenotazione = this.parseDataOra(prenotazione?.DataOra);

        if (!dataOraPrenotazione) {
          continue;
        }

        const ora = dataOraPrenotazione.getHours();
        if (ora < 8 || ora > 17) {
          continue;
        }

        const oraSlot = `${String(ora).padStart(2, '0')}:00`;
        const chiaveSlot = this.creaChiaveSlot(dataOraPrenotazione, oraSlot);
        this.chiaviSlotOccupati.add(chiaveSlot);
      }
    } catch (errore) {
      console.error('Errore nel caricamento delle prenotazioni del dottore', errore);
    }
  }

  ottieniClasseSlot(data: Date, ora: string): string {
    if (this.isSlotPassato(data)) {
      return 'past';
    }

    const chiaveSlot = this.creaChiaveSlot(data, ora);

    if (this.chiaveSlotSelezionato === chiaveSlot) {
      return 'selected';
    }

    if (this.chiaviSlotOccupati.has(chiaveSlot)) {
      return 'taken';
    }

    return 'free';
  }

  isSlotDisabilitato(data: Date, ora: string): boolean {
    if (this.isSlotPassato(data)) {
      return true;
    }

    const chiaveSlot = this.creaChiaveSlot(data, ora);
    return this.chiaviSlotOccupati.has(chiaveSlot);
  }

  selezionaSlot(data: Date, ora: string) {
    if (this.isSlotDisabilitato(data, ora)) {
      return;
    }

    this.chiaveSlotSelezionato = this.creaChiaveSlot(data, ora);
    this.slotSelezionato.emit(this.chiaveSlotSelezionato);
  }

  haSlotSelezionato(): boolean {
    return this.chiaveSlotSelezionato !== '';
  }

  private isSlotPassato(data: Date): boolean {
    return this.ottieniInizioGiorno(data).getTime() < this.dataOggi.getTime();
  }

  private resetSelezioneSlot() {
    this.chiaveSlotSelezionato = '';
    this.slotSelezionato.emit('');
  }

  private isPrenotazioneAnnullata(prenotazione: any): boolean {
    return String(prenotazione?.ValPrenotazione || '').trim().toUpperCase() === 'A';
  }

  private creaChiaveSlot(data: Date, ora: string): string {
    const anno = data.getFullYear();
    const mese = String(data.getMonth() + 1).padStart(2, '0');
    const giorno = String(data.getDate()).padStart(2, '0');

    return `${anno}-${mese}-${giorno} ${ora}`;
  }

  private parseDataOra(valoreDataOra: string): Date | null {
    if (!valoreDataOra) {
      return null;
    }

    const valoreNormalizzato = valoreDataOra.includes('T') ? valoreDataOra : valoreDataOra.replace(' ', 'T');
    const data = new Date(valoreNormalizzato);

    if (Number.isNaN(data.getTime())) {
      return null;
    }

    return data;
  }

  private parseDataInput(dataInput: string): Date | null {
    const partiData = dataInput.split('-');
    if (partiData.length !== 3) {
      return null;
    }

    const anno = Number(partiData[0]);
    const mese = Number(partiData[1]);
    const giorno = Number(partiData[2]);

    if (!anno || !mese || !giorno) {
      return null;
    }

    const data = new Date(anno, mese - 1, giorno);
    data.setHours(0, 0, 0, 0);
    return data;
  }

  private ottieniLunediSettimana(dataRiferimento: Date): Date {
    const data = new Date(dataRiferimento);
    const giornoSettimana = data.getDay();
    const differenza = giornoSettimana === 0 ? -6 : 1 - giornoSettimana;

    data.setDate(data.getDate() + differenza);
    data.setHours(0, 0, 0, 0);
    return data;
  }

  private ottieniInizioGiorno(dataRiferimento: Date): Date {
    const data = new Date(dataRiferimento);
    data.setHours(0, 0, 0, 0);
    return data;
  }

  private ottieniNomeGiorno(data: Date): string {
    const nomiGiorno = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return nomiGiorno[data.getDay()];
  }

  private ottieniNomeMeseBreve(data: Date): string {
    const nomiMese = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    return nomiMese[data.getMonth()];
  }

  private formattaDataBreve(data: Date): string {
    const giorno = String(data.getDate()).padStart(2, '0');
    const mese = String(data.getMonth() + 1).padStart(2, '0');
    const anno = data.getFullYear();
    return `${giorno}/${mese}/${anno}`;
  }

  private formattaDataPerInput(data: Date): string {
    const anno = data.getFullYear();
    const mese = String(data.getMonth() + 1).padStart(2, '0');
    const giorno = String(data.getDate()).padStart(2, '0');
    return `${anno}-${mese}-${giorno}`;
  }
}
