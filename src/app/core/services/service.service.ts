import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Service } from '../models';

@Injectable({ providedIn: 'root' })
export class ServiceCatalogService {
  private supabase = inject(SupabaseService);

  async listServicesForStaff(staffId: string): Promise<Service[]> {
    const { data, error } = await this.supabase.client
      .from('staff_services')
      .select('services(*)')
      .eq('staff_id', staffId);

    if (error) throw error;
    return (data ?? []).map((row: any) => row.services as Service);
  }
}
