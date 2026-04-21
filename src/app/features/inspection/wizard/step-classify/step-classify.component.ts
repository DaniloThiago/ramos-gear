import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { InspectionItemResult, PaintingClass, StructureClass } from '../../../../app.models';

type ClassValue = PaintingClass | StructureClass | '';

@Component({
  selector: 'app-step-classify',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './step-classify.component.html',
  styleUrl: './step-classify.component.css',
})
export class StepClassifyComponent implements OnChanges, OnInit {
  @Input({ required: true }) item!: InspectionItemResult;
  @Input() photo: string | null = null;
  @Input() notes = '';
  @Input() currentClass: ClassValue = '';

  @Output() classificationChange = new EventEmitter<{ classification: ClassValue; notes: string }>();
  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();

  readonly notesControl = new FormControl('', { nonNullable: true });
  readonly classControl = new FormControl<ClassValue>('', { nonNullable: true });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['notes']) {
      this.notesControl.setValue(this.notes, { emitEvent: false });
    }

    if (changes['currentClass']) {
      this.classControl.setValue(this.currentClass, { emitEvent: false });
    }
  }

  ngOnInit(): void {
    this.notesControl.setValue(this.notes);
    this.classControl.setValue(this.currentClass);

    this.notesControl.valueChanges.subscribe((value) => {
      this.emitState(this.classControl.value, value);
    });

    this.classControl.valueChanges.subscribe((value) => {
      this.emitState(value, this.notesControl.value);
    });
  }

  get isNextDisabled(): boolean {
    if (this.item.kind === 'geral') {
      return false;
    }

    return !this.classControl.value;
  }

  choices(): Array<PaintingClass | StructureClass> {
    if (this.item.kind === 'pintura') {
      return ['Original', 'Repintura', 'Retrabalhada', 'Substituida'];
    }

    if (this.item.kind === 'estrutura') {
      return ['Original', 'Reparo', 'Avariada'];
    }

    return [];
  }

  choiceTone(choice: PaintingClass | StructureClass): 'success' | 'warning' | 'danger' {
    if (choice === 'Original') {
      return 'success';
    }

    if (choice === 'Repintura' || choice === 'Retrabalhada' || choice === 'Reparo') {
      return 'warning';
    }

    return 'danger';
  }

  private emitState(classification: ClassValue, notes: string): void {
    this.classificationChange.emit({
      classification,
      notes,
    });
  }
}
