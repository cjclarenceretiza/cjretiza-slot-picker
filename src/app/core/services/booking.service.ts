import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Booking, CreateBookingInput } from '../models';

export interface BookingWithService extends Booking {
  services: { name: string } | null;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private supabase = inject(SupabaseService);

  async createBooking(input: CreateBookingInput): Promise<Booking> {
    const { data, error } = await this.supabase.client
      .from('bookings')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async listBookingsForStaffOnDate(
    staffId: string,
    dayStartUtc: string,
    dayEndUtc: string
  ): Promise<BookingWithService[]> {
    const { data, error } = await this.supabase.client
      .from('bookings')
      .select('*, services(name)')
      .eq('staff_id', staffId)
      .gte('starts_at', dayStartUtc)
      .lt('starts_at', dayEndUtc)
      .order('starts_at');

    if (error) throw error;
    return (data ?? []) as BookingWithService[];
  }

  async cancelBooking(bookingId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) throw error;
  }
}
