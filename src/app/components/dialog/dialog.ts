import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
})
export class Dialog {
  @Input() visible = false;
  @Input() title = '';
  @Input() trackCount = 0;
  @Input() duration = '';
  @Input() thumbnail = '';
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.visible = false;
    this.close.emit();
  }
}
