export type BookingStatus = 'confirmed' | 'cancelled' | 'no_show';

export interface Booking {
  id: string;
  salon_id: string;
  staff_id: string;
  service_id: string;
  customer_name: string;
  starts_at: string;
  ends_at: string;   
  status: BookingStatus;
  created_at: string;
}

export interface CreateBookingInput {
  salon_id: string;
  staff_id: string;
  service_id: string;
  customer_name: string;
  starts_at: string;
  ends_at: string;
}
