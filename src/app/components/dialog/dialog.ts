import { Component, Input, Output, EventEmitter, input } from '@angular/core';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';

interface dataDialog {
  type: string;
  title: string;
  text?: string;
}


@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
})
export class Dialog {
  @Input() visible = false;
  data = input.required<dataDialog>();
  @Output() close = new EventEmitter<void>();
  viewDataOption = false;
  optionSelected: any = null;
  options = [
    { title: 'Descargar Archivo', icon: '', type: 'download', name: 'Descargar', value: 'option1' },
    { title: '', icon: '', type: 'compare', name: 'Comparar', value: 'option2' },
    { title: '', icon: '', type: 'reload', name: 'Actualizar', value: 'option3' },
  ];

  constructor(
    private youtubeService: Youtube,
    private googleService: Google,
  ){}

  downloadExcel(){
    const list = 'PLzfpPpqZplBa5jzeRWM6-gkTpdlgbEecr/';
    this.youtubeService.getPlaylistExcel(list).subscribe({
      next: (blob: Blob) => {
        const blobExcel = new Blob([blob], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blobExcel);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_generado.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar el archivo:', err);
      }
    });
  }

  authenticateWithGoogle(){
    this.googleService.authenticateWithGoogle().subscribe({
      next: (payload) => {
        this.onClose();
      },
      error: (err) => console.error(err.message),
    });
  }

  openOption(option: any) {
    this.optionSelected = option;
    this.viewDataOption = true;
  }

  resetDialog(){
    this.viewDataOption = false;
    this.optionSelected = null;
  }

  onClose() {
    this.visible = false;
    this.resetDialog();
    this.close.emit();
  }
}
