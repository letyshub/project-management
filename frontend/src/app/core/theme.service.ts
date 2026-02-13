import { Injectable, signal } from '@angular/core';

const THEME_KEY = 'theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark = signal(localStorage.getItem(THEME_KEY) === 'dark');

  constructor() {
    if (this.isDark()) {
      document.body.classList.add('dark-theme');
    }
  }

  toggle() {
    const dark = !this.isDark();
    this.isDark.set(dark);
    document.body.classList.toggle('dark-theme', dark);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  }
}
