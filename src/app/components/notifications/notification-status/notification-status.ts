import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationSubscription } from '../../../models';

@Component({
  selector: 'app-notification-status',
  imports: [CommonModule],
  templateUrl: './notification-status.html',
  styleUrl: './notification-status.css',
})
export class NotificationStatus {
  subscription = input<NotificationSubscription | null>(null);
  refresh = output<void>();

  onRefresh() {
    this.refresh.emit();
  }
}
