import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { TimeOff, CreateTimeOffInput, UpdateTimeOffInput } from '../models';

@Injectable({ providedIn: 'root' })
export class TimeOffService {
  private supabase = inject(SupabaseService);

  async listTimeOffForStaffOnDate(
    staffId: string,
    dayStartUtc: string,
    dayEndUtc: string
  ): Promise<TimeOff[]> {
    const { data, error } = await this.supabase.client
      .from('time_off')
      .select('*')
      .eq('staff_id', staffId)
      .lt('starts_at', dayEndUtc)
      .gt('ends_at', dayStartUtc)
      .order('starts_at');

    if (error) throw error;
    return data ?? [];
  }

  async createTimeOff(input: CreateTimeOffInput): Promise<TimeOff> {
    const { data, error } = await this.supabase.client
      .from('time_off')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTimeOff(id: string, input: UpdateTimeOffInput): Promise<TimeOff> {
    const { data, error } = await this.supabase.client
      .from('time_off')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTimeOff(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('time_off')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
