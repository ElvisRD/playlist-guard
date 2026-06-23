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
    private googleService: Google
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
    this.googleService.authenticateUser().subscribe({
      next: (res: any) => {
        this.openGoogleAuth(res.url);
      },
      error: (err) => {
        console.error('Error al obtener la URL de autenticación:', err);
      }
    });
  }

  openGoogleAuth(url: string){
    const windowFeatures = {
      width: 500,
      height: 500,
      left: (window.screen.width - 500) / 2,
      top: (window.screen.height - 500) / 2,
    };

    const authWindow = window.open(url, 'GoogleAuth', `width=${windowFeatures.width},height=${windowFeatures.height},left=${windowFeatures.left},top=${windowFeatures.top}`);

    if (!authWindow) {
      console.error('El navegador bloqueó el popup. Por favor, permite las ventanas emergentes.');
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('¡Usuario autenticado con éxito!', event.data.payload);
        authWindow.close();
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);
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
