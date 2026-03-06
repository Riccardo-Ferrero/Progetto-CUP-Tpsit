import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'modal-conferma',
  imports: [],
  templateUrl: './modal-conferma.html',
  styleUrl: './modal-conferma.css',
})
export class ModalConferma {
  @Input() visibile: boolean = false;
  @Input() messaggio: string = 'Sei sicuro?';

  @Output() risposta = new EventEmitter<boolean>();

  onSiClick() {
    this.risposta.emit(true);
  }

  onNoClick() {
    this.risposta.emit(false);
  }
}
