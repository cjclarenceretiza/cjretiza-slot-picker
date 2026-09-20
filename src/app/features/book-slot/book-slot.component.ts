// src/app/features/book-slot/book-slot.component.ts
import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SalonService } from '../../core/services/salon.service';
import { StaffService } from '../../core/services/staff.service';
import { ServiceCatalogService } from '../../core/services/service.service';
import { SlotService } from '../../core/services/slot.service';
import { BookingService } from '../../core/services/booking.service';

import { Salon, Staff, Service } from '../../core/models';

import { BookingsListComponent } from '../bookings-list/bookings-list.component';

@Component({
  selector: 'app-book-slot',
  standalone: true,
  imports: [FormsModule, BookingsListComponent],
  templateUrl: './book-slot.component.html'
})

export class BookSlotComponent implements OnInit {
  private salonService = inject(SalonService);
  private staffService = inject(StaffService);
  private serviceCatalog = inject(ServiceCatalogService);
  private slotService = inject(SlotService);
  private bookingService = inject(BookingService);

  // Reference data
  salons = signal<Salon[]>([]);
  staff = signal<Staff[]>([]);
  services = signal<Service[]>([]);

  // Selection state
  selectedSalonId = signal<string | null>(null);
  selectedStaffId = signal<string | null>(null);
  selectedServiceId = signal<string | null>(null);
  selectedDate = signal<string>(this.today());

  // Slot results
  slots = signal<string[]>([]);
  loadingSlots = signal(false);
  customerName = signal('');
  booking = signal(false);
  errorMessage = signal<string | null>(null);

  selectedSalon = computed(() =>
    this.salons().find(s => s.id === this.selectedSalonId()) ?? null
  );

  canSearch = computed(() =>
    !!this.selectedStaffId() && !!this.selectedServiceId() && !!this.selectedDate()
  );

  constructor() {
    effect(() => {
      const staffId = this.selectedStaffId();
      const serviceId = this.selectedServiceId();
      const date = this.selectedDate();

      if (staffId && serviceId && date) {
        this.searchSlots();
      } else {
        this.slots.set([]);
      }
    });
  }

  async ngOnInit() {
    this.salons.set(await this.salonService.listSalons());
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  async onSalonChange(salonId: string) {
    this.selectedSalonId.set(salonId || null);
    this.selectedStaffId.set(null);
    this.selectedServiceId.set(null);
    this.staff.set([]);
    this.services.set([]);
    this.slots.set([]);

    if (salonId) {
      this.staff.set(await this.staffService.listActiveStaffForSalon(salonId));
    }
  }

  async onStaffChange(staffId: string) {
    this.selectedStaffId.set(staffId || null);
    this.selectedServiceId.set(null);
    this.services.set([]);
    this.slots.set([]);

    if (staffId) {
      this.services.set(await this.serviceCatalog.listServicesForStaff(staffId));
    }
  }

  onServiceChange(serviceId: string) {
    this.selectedServiceId.set(serviceId || null);
    this.slots.set([]);
  }

  onDateChange(date: string) {
    this.selectedDate.set(date);
    this.slots.set([]);
  }

  async searchSlots() {
    if (!this.canSearch()) return;

    this.errorMessage.set(null);
    this.loadingSlots.set(true);
    try {
      const result = await this.slotService.getAvailableSlots(
        this.selectedStaffId()!,
        this.selectedServiceId()!,
        this.selectedDate()!
      );
      this.slots.set(result);
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Failed to load slots.');
    } finally {
      this.loadingSlots.set(false);
    }
  }

  formatSlot(isoUtc: string): string {
    const tz = this.selectedSalon()?.timezone;
    return new Date(isoUtc).toLocaleTimeString('en-AU', {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: tz
    });
  }

  async bookSlot(isoUtc: string) {
    if (!this.customerName().trim()) {
      this.errorMessage.set('Enter a customer name first.');
      return;
    }

    const service = this.services().find(s => s.id === this.selectedServiceId());
    if (!service) return;

    this.booking.set(true);
    this.errorMessage.set(null);
    try {
      const startsAt = new Date(isoUtc);
      const endsAt = new Date(startsAt.getTime() + service.duration_minutes * 60_000);

      await this.bookingService.createBooking({
        salon_id: this.selectedSalonId()!,
        staff_id: this.selectedStaffId()!,
        service_id: this.selectedServiceId()!,
        customer_name: this.customerName().trim(),
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString()
      });

      this.customerName.set('');
      await this.searchSlots(); // booked slot disappears
    } catch (err: any) {
      this.errorMessage.set(err.message ?? 'Failed to create booking.');
    } finally {
      this.booking.set(false);
    }
  }
}
