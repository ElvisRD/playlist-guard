import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
})
export class Dialog {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();
  viewDataOption = false;
  optionSelected: any = null;
  title = 'Opciones Playlist';
  options = [
    { icon: '', type: 'download', name: 'Descargar', value: 'option1' },
    { icon: '', type: 'compare', name: 'Comparar', value: 'option2' },
    { icon: '', type: 'reload', name: 'Actualizar', value: 'option3' },
  ];

  openOption(option: any) { 
    this.optionSelected = option;
    this.viewDataOption = true;
    this.title = option.name;
  }

  resetDialog(){
    this.viewDataOption = false;
    this.optionSelected = null;
    this.title = 'Opciones Playlist';
  }

  onClose() {
    this.visible = false;
    this.resetDialog();
    this.close.emit();
  }
}
