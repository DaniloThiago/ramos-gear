import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-camera',
  standalone: true,
  templateUrl: './camera.component.html',
  styleUrl: './camera.component.css',
})
export class CameraComponent {
  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @Output() photoCapture = new EventEmitter<string>();

  async openCamera(): Promise<void> {
    this.fileInput?.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    const compressed = await this.compressImage(file, 1280, 0.7);
    this.photoCapture.emit(compressed);
    input.value = '';
  }

  compressImage(file: File, maxWidth = 1280, quality = 0.7): Promise<string> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, maxWidth / image.width);

        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext('2d');
        if (!context) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Canvas context unavailable'));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(objectUrl);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Unable to load image'));
      };

      image.src = objectUrl;
    });
  }
}

