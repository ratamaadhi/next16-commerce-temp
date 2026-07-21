"use client";

import { useQuery } from "@tanstack/react-query";
import type { PaymentMethods } from "@/lib/payment";

const DISABLED: PaymentMethods = {
  gateway: false,
  manualTransfer: false,
  bankAccounts: [],
};

async function fetchPaymentMethods(): Promise<PaymentMethods> {
  const res = await fetch("/api/store-setting/payment-methods");
  if (!res.ok) return DISABLED;
  const json = await res.json();
  return {
    gateway: !!json.data?.gateway,
    manualTransfer: !!json.data?.manualTransfer,
    bankAccounts: json.data?.bankAccounts ?? [],
  };
}

export function usePaymentMethods() {
  const { data, isLoading } = useQuery({
    queryKey: ["payment-methods"],
    queryFn: fetchPaymentMethods,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return { methods: data, isLoading };
}
