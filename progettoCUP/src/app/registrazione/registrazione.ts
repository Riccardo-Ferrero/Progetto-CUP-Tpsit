import { Component } from '@angular/core';
import { FormsModule,NgForm } from '@angular/forms';
import { OnInit } from '@angular/core';
@Component({
  selector: 'registrazione',
  imports: [FormsModule],
  templateUrl: './registrazione.html',
  styleUrl: './registrazione.css',
})
export class Registrazione implements OnInit {
  paziente = {
    
  };
  toponimi: Array<{ ID: number; Toponimo: string; ValToponimo?: string }> = [];
  
  onSubmit(f: NgForm) {

  }

  async ngOnInit() {
    this.getToponimi();
  }

  async getToponimi() {
    try {
      const res = await fetch("http://localhost:8081/toponimi");
      if (!res.ok) {
        console.error('Errore caricamento toponimi', res.status);
        this.toponimi = [];
        return;
      }
      this.toponimi = await res.json();
      // ensure it's an array
      if (!Array.isArray(this.toponimi)) this.toponimi = [];
      console.log('Toponimi caricati:', this.toponimi.length);
    } catch (err) {
      console.error('Impossibile recuperare toponimi', err);
      this.toponimi = [];
    }
  }

}
