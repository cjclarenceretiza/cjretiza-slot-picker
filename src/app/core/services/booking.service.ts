import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Booking, CreateBookingInput } from '../models';

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
}
