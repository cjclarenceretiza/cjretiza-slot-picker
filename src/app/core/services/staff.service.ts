import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Staff } from '../models';

@Injectable({ providedIn: 'root'})
export class StaffService {
  private supabase = inject(SupabaseService);

  async listActiveStaffForSalon(salonId: string): Promise<Staff[]> {
    const { data, error } = await this.supabase.client
      .from('staff')
      .select('*')
      .eq('salon_id', salonId)
      .eq('is_active', true)
      .order('full_name');

      if (error) throw error;
    return data ?? [];
  }
}
