import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
})
export class Dialog {
  @Input() visible = false;
  @Input() authRequired = false;
  @Input() title = 'Opciones Playlist';
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


  authenticateWithGoogle(){
    this.googleService.authenticateUser().subscribe({
      next: (res: any) => {

        this.openGoogleAuth(res.url);

        /* const authUrl = res.authUrl;
        window.location.href = authUrl; */ // Redirige al usuario a la URL de autenticación de Google
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
      // Reemplaza con la URL real de tu frontend/backend por seguridad
      if (event.origin !== window.location.origin) return; 

      if (event.data?.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('¡Usuario autenticado con éxito!', event.data.payload);
        
        // Aquí manejas el login en tu app (guardar token, redirigir al home, etc.)
        // TuServicio.saveToken(event.data.payload.token);

        authWindow.close(); // Cerramos la mini ventana
        window.removeEventListener('message', handleMessage); // Limpiamos el listener
      }
    };

    window.addEventListener('message', handleMessage);
    
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
