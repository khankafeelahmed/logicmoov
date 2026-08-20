export type VehicleType = "SEDAN" | "SUV" | "VAN" | "MINIBUS" | "LUXURY";

export const INCLUSION_OPTIONS = [
  "Free Wi-Fi",
  "Air Conditioning",
  "Free Water Bottle",
  "Phone Charger",
  "Child Seat Available",
  "Wheelchair Accessible",
  "Luggage Assistance",
  "Meet & Greet",
  "Flight Tracking",
  "GPS Navigation",
] as const;

export interface Driver {
  id?: string;
  full_name: string;
  whatsapp_number: string;
  email?: string;
  license_number?: string;
  license_expiry?: string;
  languages: string[];
  photo_url?: string;
}

export interface Vehicle {
  id?: string;
  driver_id?: string;
  plate_number: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  year?: number;
  color?: string;
  seat_capacity: number;
  luggage_capacity?: number;
  electric: boolean;
  inclusions: string[];
  photo_urls: string[];
}
