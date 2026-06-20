"use client";

import { useQuery } from "@tanstack/react-query";

interface StoreSettings {
  whatsappNumber: string | null;
}

async function fetchStoreSettings(): Promise<StoreSettings> {
  const res = await fetch("/api/store-setting");
  if (!res.ok) return { whatsappNumber: null };
  const json = await res.json();
  return { whatsappNumber: json.data?.whatsappNumber ?? null };
}

export function useStoreSettings() {
  const { data } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchStoreSettings,
    staleTime: Infinity,
    retry: false,
  });

  return {
    whatsappNumber: data?.whatsappNumber ?? null,
  };
}
