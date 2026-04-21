import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { defaultBranding } from './app.data';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly branding = defaultBranding;
  protected readonly title = signal('Ramos Gear');
}
