import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule,NgForm } from '@angular/forms';
import { Router } from '@angular/router';

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
    confermaPassword: '',

    idToponimo: '',
    indirizzo: '',
    ncivico: '',
    idProvincia: '',
    idComune: '',

    gruppoSanguigno: '',
    peso: null,
    altezza: null
  };

 
  toponimi: any[] = [];
  province: any[] = [];
  comuni: any[] = [];
  maxDate: string = '';
  erroreRegistrazione: string = '';

  async onSubmit(f: NgForm) {
    this.erroreRegistrazione = '';
    this.cdr.detectChanges();

    try {
      const risposta = await fetch("http://localhost:8081/registrazione", {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(this.Paziente)
      });

      const rispostaTesto = await risposta.text();
      let ris: any = null;
      try {
        ris = rispostaTesto ? JSON.parse(rispostaTesto) : null;
      } catch {
        ris = { result: 'error', message: rispostaTesto || 'Errore durante la registrazione' };
      }

      if(risposta.ok && ris.result === 'success') {
        console.log('Paziente registrato con successo');
        f.resetForm();
        this.router.navigate(['/home']);
        localStorage.setItem("user", JSON.stringify(ris.idUtente));
        return;
      }

      if (ris?.field === 'email') {
        this.erroreRegistrazione = 'Questa email è già in uso';
        this.cdr.detectChanges();
        return;
      }

      if (ris?.field === 'codiceFiscale') {
        this.erroreRegistrazione = 'Questo codice fiscale è già in uso';
        this.cdr.detectChanges();
        return;
      }

      if (risposta.status === 409) {
        this.erroreRegistrazione = ris?.message || 'Email o codice fiscale già in uso';
        this.cdr.detectChanges();
        return;
      }

      this.erroreRegistrazione = ris?.message || 'Registrazione non riuscita';
      this.cdr.detectChanges();
    } catch {
      this.erroreRegistrazione = 'Errore di connessione al server';
      this.cdr.detectChanges();
    }
  }

  onCodiceFiscaleChange(value: string) {
    this.Paziente.codiceFiscale = (value ?? '').toUpperCase().replace(/\s+/g, '');
  }
  
  constructor(private cdr: ChangeDetectorRef, private router: Router) {
    this.getToponimi();
    this.getProvince();
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
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
