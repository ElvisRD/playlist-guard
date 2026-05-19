import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Youtube } from '../../services/youtube';

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
    { title: 'Descargar Archivo', icon: '', type: 'download', name: 'Descargar', value: 'option1' },
    { title: '', icon: '', type: 'compare', name: 'Comparar', value: 'option2' },
    { title: '', icon: '', type: 'reload', name: 'Actualizar', value: 'option3' },
  ];

  constructor(private youtubeService: Youtube){}

  downloadExcel(){
    const list = 'PLzfpPpqZplBa5jzeRWM6-gkTpdlgbEecr/';
    this.youtubeService.getPlaylistExcel(list).subscribe({
      next: (blob: Blob) => {
        // 1. Definir el tipo MIME específico para archivos .xlsx
        const blobExcel = new Blob([blob], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });

        // 2. Crear una URL local para el objeto Blob
        const url = window.URL.createObjectURL(blobExcel);

        // 3. Crear un elemento <a> invisible en memoria
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte_generado.xlsx'; // El nombre que tendrá el archivo

        // 4. Simular el clic para activar la descarga del navegador
        document.body.appendChild(a);
        a.click();

        // 5. Limpieza: remover el elemento y liberar la memoria de la URL
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error al descargar el archivo:', err);
      }
    });
  }

  openOption(option: any) { 
    this.optionSelected = option;
    this.viewDataOption = true;
    this.title = option.title;
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
