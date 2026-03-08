import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'nuovo-admin',
  imports: [FormsModule],
  templateUrl: './nuovo-admin.html',
  styleUrl: './nuovo-admin.css',
})
export class NuovoAdmin {
  Admin = {
    nomeAdmin: '',
    email: '',
    telefono: '',
    password: '',
    confermaPassword: '',
  };

  erroreCreazioneAdmin: string = '';
  isAdmin: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {
    this.getAmministratore();
  }

  async onSubmit(f: NgForm) {
    this.erroreCreazioneAdmin = '';
    this.cdr.detectChanges();

    try {
      const risposta = await fetch('http://localhost:8081/aggiungiAdmin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.Admin),
        credentials: 'include',
      });

      const rispostaTesto = await risposta.text();
      let ris: any = null;
      try {
        ris = rispostaTesto ? JSON.parse(rispostaTesto) : null;
      } catch {
        ris = { result: 'error', message: rispostaTesto || 'Errore durante la creazione admin' };
      }

      if (risposta.ok && ris?.result === 'success') {
        f.resetForm();
        this.router.navigate(['/home-admin']);
        return;
      }

      if (ris?.field === 'email') {
        this.erroreCreazioneAdmin = 'Questa email e gia in uso';
        this.cdr.detectChanges();
        return;
      }

      this.erroreCreazioneAdmin = ris?.message || 'Creazione admin non riuscita';
      this.cdr.detectChanges();
    } catch {
      this.erroreCreazioneAdmin = 'Errore di connessione al server';
      this.cdr.detectChanges();
    }
  }

  async getAmministratore() {
    try {
      const utenteSessioneRis = await fetch('http://localhost:8081/utenteSessione', {
        method: 'GET',
        credentials: 'include',
      });

      if (utenteSessioneRis.status === 401) {
        this.router.navigate(['/login']);
        return;
      }

      const utenteSessioneJson = await utenteSessioneRis.json();
      this.isAdmin =
        String(utenteSessioneJson?.amministratore || '')
          .trim()
          .toUpperCase() === 'S';

      if (!this.isAdmin) {
        this.router.navigate(['/login']);
      }
    } catch (err) {
      console.error('Impossibile recuperare utente sessione', err);
      this.router.navigate(['/login']);
    }
  }

}
