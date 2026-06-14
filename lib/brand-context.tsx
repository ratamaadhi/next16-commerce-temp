"use client";

import { createContext, useContext } from "react";
import type { BrandId } from "@/types/brand";

const BrandContext = createContext<BrandId>("cyra");

export function BrandProvider({
  brand,
  children,
}: {
  brand: BrandId;
  children: React.ReactNode;
}) {
  return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandId {
  return useContext(BrandContext);
}
