import { Routes } from '@angular/router';
import { Registrazione } from './registrazione/registrazione';
import { FirstPage } from './first-page/first-page';
import { HomePage } from './home-page/home-page';
import { Login } from './login/login';
import { NuovaPrenotazione } from './nuova-prenotazione/nuova-prenotazione';
import { NuovaPrenotazioneCalendario } from './nuova-prenotazione-calendario/nuova-prenotazione-calendario';
import { VisualizzaPrenotazioni } from './visualizza-prenotazioni/visualizza-prenotazioni';
import { Pagamento } from './pagamento/pagamento';
import { ModificaPrenotazione } from './modifica-prenotazione/modifica-prenotazione';
import { HomeAdmin } from './home-admin/home-admin';

export const routes: Routes = [
  { path: 'registrazione', component: Registrazione },
  { path: '', component: FirstPage},
  { path: 'home', component: HomePage},
  { path: 'login', component: Login},
  { path: 'nuova-prenotazione', component: NuovaPrenotazione},
  { path: 'nuova-prenotazione-calendario', component: NuovaPrenotazioneCalendario},
  { path: 'visualizza-prenotazioni', component: VisualizzaPrenotazioni},
  { path: 'pagamento', component: Pagamento},
  { path: 'modifica-prenotazione', component: ModificaPrenotazione},
  { path: 'home-admin', component: HomeAdmin}
];