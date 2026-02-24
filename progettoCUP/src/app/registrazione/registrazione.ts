import { Component } from '@angular/core';
import { FormsModule,NgForm } from '@angular/forms';
@Component({
  selector: 'registrazione',
  imports: [FormsModule],
  templateUrl: './registrazione.html',
  styleUrl: './registrazione.css',
})
export class Registrazione {
  paziente = {
    
  };
  onSubmit(f: NgForm) {

  }
}
