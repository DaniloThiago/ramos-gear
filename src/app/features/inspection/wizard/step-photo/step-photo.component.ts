import { Component, EventEmitter, Input, Output } from '@angular/core';
import { InspectionItemResult } from '../../../../app.models';
import { CameraComponent } from '../../../../shared/components/camera/camera.component';

@Component({
  selector: 'app-step-photo',
  standalone: true,
  imports: [CameraComponent],
  templateUrl: './step-photo.component.html',
  styleUrl: './step-photo.component.css',
})
export class StepPhotoComponent {
  @Input({ required: true }) item!: InspectionItemResult;
  @Input() photo: string | null = null;

  @Output() photoCaptured = new EventEmitter<string>();
  @Output() confirmPhoto = new EventEmitter<void>();
  @Output() redoPhoto = new EventEmitter<void>();

  onCapture(photo: string): void {
    this.photoCaptured.emit(photo);
  }
}
