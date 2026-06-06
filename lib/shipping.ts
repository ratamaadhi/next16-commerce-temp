export interface SubdistrictResult {
  id: number;
  name: string;
  sub_district_name: string;
  city_name?: string;
  province_name?: string;
  district_name?: string;
  postal_code?: string;
}

export interface ShippingOption {
  service: string;
  name: string;
  price: number;
  etd: string;
  etdNamed: string;
  imageUrl?: string;
  cod: boolean;
  group: string;
}

export function getDimensionsByWeight(totalWeightGrams: number): {
  length: number;
  width: number;
  height: number;
} {
  const kg = totalWeightGrams / 1000;
  if (kg <= 1) return { length: 20, width: 15, height: 10 };
  if (kg <= 2) return { length: 27, width: 13, height: 7 };
  if (kg <= 5) return { length: 30, width: 20, height: 15 };
  return { length: 40, width: 30, height: 20 };
}
