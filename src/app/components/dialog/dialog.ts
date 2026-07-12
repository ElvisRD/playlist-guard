import { Component, Input, Output, EventEmitter, input, signal, effect, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Youtube } from '../../services/youtube';
import { Google } from '../../services/google';

@Component({
  selector: 'app-dialog',
  imports: [],
  templateUrl: './dialog.html',
  styleUrl: './dialog.css',
})
export class Dialog implements OnInit {
  @Input() visible = false;
  playlist = input<any>(null);
  type = input.required<string>();
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<void>();

  private http = inject(HttpClient);
  private youtubeService = inject(Youtube);
  private googleService = inject(Google);

  private dialogTexts: Record<string, any> = {};
  dialogConfig = signal<any>(null);
  optionSelected: any = null;

  constructor() {
    effect(() => {
      const currentType = this.type();
      if (currentType && this.dialogTexts[currentType]) {
        this.dialogConfig.set(this.dialogTexts[currentType]);
      }
    });
  }

  ngOnInit() {
    this.http.get<Record<string, any>>('/jsons/dialogText.json').subscribe({
      next: (data) => {
        this.dialogTexts = data;
        const currentType = this.type();
        if (currentType && data[currentType]) {
          this.dialogConfig.set(data[currentType]);
        }
      },
      error: (err) => console.error('Error loading dialog texts:', err),
    });
  }

  downloadExcel() {
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

  authenticateWithGoogle() {
    this.googleService.authenticateWithGoogle().subscribe({
      next: (payload) => {
        this.onClose();
      },
      error: (err) => console.error(err.message),
    });
  }

  savePlaylist() {
    this.save.emit();
  }

  onClose() {
    this.close.emit();
  }
}
