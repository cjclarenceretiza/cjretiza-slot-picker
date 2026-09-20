import { Component, Input, OnChanges, inject, signal, Output, EventEmitter } from '@angular/core';
import { BookingService, BookingWithService } from '../../core/services/booking.service';

@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [],
  templateUrl: './bookings-list.component.html'
})
export class BookingsListComponent implements OnChanges {
  @Input({ required: true }) staffId!: string;
  @Input({ required: true }) date!: string;
  @Input({ required: true }) timezone!: string;

  @Output() bookingCancelled = new EventEmitter<void>();

  private bookingService = inject(BookingService);

  bookings = signal<BookingWithService[]>([]);
  loading = signal(false);
  errorMessage = signal<string | null>(null);
  cancellingId = signal<string | null>(null);

  async ngOnChanges() {
    if (!this.staffId || !this.date) {
      this.bookings.set([]);
      return;
    }
    await this.load();
  }

  private async load() {
    this.errorMessage.set(null);
    this.loading.set(true);
    try {
      const { dayStartUtc, dayEndUtc } = this.localDayBoundsToUtc(this.date, this.timezone);
      const result = await this.bookingService.listBookingsForStaffOnDate(
        this.staffId,
        dayStartUtc,
        dayEndUtc
      );
      this.bookings.set(result);
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Failed to load bookings.');
    } finally {
      this.loading.set(false);
    }
  }

  private localDayBoundsToUtc(date: string, timezone: string) {
    const probe = new Date(`${date}T00:00:00Z`);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(probe);

    const get = (type: string) => parts.find(p => p.type === type)!.value;
    const localAtProbe = new Date(Date.UTC(
      +get('year'), +get('month') - 1, +get('day'),
      +get('hour'), +get('minute'), +get('second')
    ));
    const offsetMs = localAtProbe.getTime() - probe.getTime();

    const dayStartUtc = new Date(new Date(`${date}T00:00:00Z`).getTime() - offsetMs);
    const dayEndUtc = new Date(dayStartUtc.getTime() + 24 * 60 * 60 * 1000);

    return { dayStartUtc: dayStartUtc.toISOString(), dayEndUtc: dayEndUtc.toISOString() };
  }

  formatTime(isoUtc: string): string {
    return new Date(isoUtc).toLocaleTimeString('en-AU', {
      hour: 'numeric', minute: '2-digit', timeZone: this.timezone
    });
  }

  async cancel(booking: BookingWithService) {
    this.cancellingId.set(booking.id);
    this.errorMessage.set(null);
    try {
      await this.bookingService.cancelBooking(booking.id);
      await this.load();
      this.bookingCancelled.emit();
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Failed to cancel booking.');
    } finally {
      this.cancellingId.set(null);
    }
  }
}
