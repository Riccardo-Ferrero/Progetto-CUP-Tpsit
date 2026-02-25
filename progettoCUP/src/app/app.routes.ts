import { Routes } from '@angular/router';
import { Registrazione } from './registrazione/registrazione';
import { FirstPage } from './first-page/first-page';

export const routes: Routes = [
  { path: 'registrazione', component: Registrazione },
  { path: '', component: FirstPage}
];