"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Address, AddressFormData, AddressListResponse } from "@/types/address";

async function fetchAddresses(): Promise<Address[]> {
  const res = await fetch("/api/addresses");
  if (!res.ok) throw new Error("Failed to fetch addresses");
  const data = await res.json();
  const list = Array.isArray(data) ? data : data?.data;
  return list ?? [];
}

async function createAddress(data: AddressFormData): Promise<Address> {
  const res = await fetch("/api/addresses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Gagal menyimpan alamat");
  }
  const result = await res.json();
  return result.data;
}

async function updateAddress(id: string, data: Partial<AddressFormData>): Promise<Address> {
  const res = await fetch(`/api/addresses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!res.ok) throw new Error("Gagal mengupdate alamat");
  const result = await res.json();
  return result.data;
}

async function deleteAddress(id: string): Promise<void> {
  const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Gagal menghapus alamat");
}

async function setDefaultAddress(id: string): Promise<Address> {
  const res = await fetch(`/api/addresses/${id}/default`, { method: "PATCH" });
  if (!res.ok) throw new Error("Gagal mengubah alamat utama");
  const result = await res.json();
  return result.data;
}

export function useAddresses() {
  const queryClient = useQueryClient();
  const queryKey = ["addresses"];

  const { data: addresses = [], isLoading } = useQuery({
    queryKey,
    queryFn: fetchAddresses,
    staleTime: 5 * 60 * 1000,
  });

  const createMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Alamat berhasil disimpan");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Gagal menyimpan alamat");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressFormData> }) =>
      updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Alamat berhasil diperbarui");
    },
    onError: () => {
      toast.error("Gagal mengupdate alamat");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAddress,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Address[]>(queryKey);
      queryClient.setQueryData<Address[]>(queryKey, (old) =>
        old ? old.filter((a) => a.documentId !== id) : [],
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
      toast.error("Gagal menghapus alamat");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<Address[]>(queryKey);
      queryClient.setQueryData<Address[]>(queryKey, (old) =>
        old
          ? old.map((a) => ({ ...a, isDefault: a.documentId === id }))
          : [],
      );
      return { prev };
    },
    onError: (_err, _id, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
      toast.error("Gagal mengubah alamat utama");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    addresses,
    isLoading,
    createAddress: createMutation.mutateAsync,
    updateAddress: updateMutation.mutateAsync,
    deleteAddress: deleteMutation.mutate,
    setDefaultAddress: setDefaultMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
