export interface SubdistrictResult {
  id: number;
  name: string;
  city?: string;
  province?: string;
}

export interface ShippingOption {
  name: string;
  price: number;
  etd?: string;
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
