import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InspectionService } from '../../../core/inspection/inspection.service';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css',
})
export class SummaryComponent {
  constructor(public readonly inspectionService: InspectionService) {}
}

