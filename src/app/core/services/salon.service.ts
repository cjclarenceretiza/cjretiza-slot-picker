import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Salon } from '../models';

@Injectable({ providedIn: 'root'})
export class SalonService {
  private supabase = inject(SupabaseService);

  async listSalons(): Promise<Salon[]> {
    const { data, error } = await this.supabase.client
      .from('salons')
      .select('*')
      .order('name');

      if (error) throw error;
      return data ?? [];
  }
}
