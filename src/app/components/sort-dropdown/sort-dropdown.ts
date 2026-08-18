import { Component, input, output, signal, computed } from '@angular/core';

@Component({
  selector: 'app-sort-dropdown',
  imports: [],
  templateUrl: './sort-dropdown.html',
  styleUrl: './sort-dropdown.css',
})
export class SortDropdown {
  options = input.required<Record<string, string>>();
  selected = input<string>('fecha');

  selectedChange = output<string>();

  isOpen = signal(false);

  optionKeys = computed(() => Object.keys(this.options()));

  toggleDropdown() {
    this.isOpen.update((v) => !v);
  }

  select(value: string) {
    this.selectedChange.emit(value);
    this.isOpen.set(false);
  }
}
