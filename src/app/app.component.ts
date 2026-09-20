import { Component } from '@angular/core';
import { BookSlotComponent } from './features/book-slot/book-slot.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [BookSlotComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {}
