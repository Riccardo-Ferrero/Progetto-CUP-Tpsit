import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule,NgForm } from '@angular/forms';

@Component({
  selector: 'registrazione',
  imports: [FormsModule],
  templateUrl: './registrazione.html',
  styleUrl: './registrazione.css',
})
export class Registrazione{
  Paziente = {
    nome: '',
    cognome: '',
    dataNascita: null,
    genere: '',
    codiceFiscale: '',

    email: '',
    telefono: '',
    password: '',
    

    idToponimo: '',
    indirizzo: '',
    ncivico: '',
    idProvincia: '',
    idComune: '',

    gruppoSanguigno: '',
    peso: null,
    altezza: null
  };
  confermaPassword: string = '';
  toponimi: any[] = [];
  province: any[] = [];
  comuni: any[] = [];
  
  onSubmit(f: NgForm) {

  }
  
  constructor(private cdr: ChangeDetectorRef) {
    this.getToponimi();
    this.getProvince();
  }

  async getToponimi(){
    try {
      let ris = await fetch("http://localhost:8081/toponimi");
      ris = await ris.json();
      this.toponimi = Array.isArray(ris) ? ris : [];
      this.cdr.detectChanges();
      console.log('Toponimi caricati:', this.toponimi);
    } catch (err) {
      console.error('Impossibile recuperare toponimi', err);
      this.toponimi = [];
      this.cdr.detectChanges();
    }
    
  }

  async getProvince() {
      try {
        let ris = await fetch("http://localhost:8081/province");
        ris = await ris.json();
        this.province = Array.isArray(ris) ? ris : [];
        this.cdr.detectChanges();
        console.log('Province caricate:', this.province);
      }
      catch (err) {
        console.error('Impossibile recuperare province', err);
        this.province = [];
        this.cdr.detectChanges();
      }
  }

  onProvinciaChange(event: any) {
    const provinciaId = event.target.value;
    const cmbComune = document.getElementById('comune') as HTMLSelectElement;

    this.Paziente.idComune = '';
    this.comuni = [];

    if(provinciaId === '') {
      cmbComune.disabled = true;
    } else {
      cmbComune.disabled = false;
      this.getComuni(provinciaId);
      
    }
  }

  async getComuni(provinciaId: string) {
    try {
      let ris = await fetch(`http://localhost:8081/comuni`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ idProvincia: provinciaId })
      });
      ris = await ris.json();
      this.comuni = Array.isArray(ris) ? ris : [];
      this.cdr.detectChanges();
      console.log('Comuni caricati:', this.comuni);
      
    } catch (err) {
      console.error('Impossibile recuperare comuni', err);
      this.comuni = [];
      this.cdr.detectChanges();
    }
  }

}
