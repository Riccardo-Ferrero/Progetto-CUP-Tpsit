import { Routes } from '@angular/router';
import { Registrazione } from './registrazione/registrazione';
import { FirstPage } from './first-page/first-page';
import { HomePage } from './home-page/home-page';
import { Login } from './login/login';

export const routes: Routes = [
  { path: 'registrazione', component: Registrazione },
  { path: '', component: FirstPage},
  { path: 'home', component: HomePage},
  { path: 'login', component: Login}
];