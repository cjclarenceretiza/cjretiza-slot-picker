import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class SlotService {
  private supabase = inject(SupabaseService);

  async getAvailableSlots(
    staffId: string,
    serviceId: string,
    date: string
  ): Promise<string[]> {
    const { data, error } = await this.supabase.client.rpc('get_available_slots', {
      p_staff_id: staffId,
      p_service_id: serviceId,
      p_date: date
    });

    if (error) throw error;
    return (data ?? []).map((row: { slot_start: string }) => row.slot_start);
  }
}
