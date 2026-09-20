export interface TimeOff {
  id: string;
  staff_id: string;
  starts_at: string;
  ends_at: string;   
  reason: string | null;
}

export interface CreateTimeOffInput {
  staff_id: string;
  starts_at: string;
  ends_at: string;
  reason?: string | null;
}

export interface UpdateTimeOffInput {
  starts_at?: string;
  ends_at?: string;
  reason?: string | null;
}
