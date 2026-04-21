import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css',
})
export class ReportComponent {}

