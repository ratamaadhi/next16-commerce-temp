"use client";

import { Plus } from "lucide-react";
import { AddressCard } from "@/components/addresses/address-card";
import type { Address } from "@/types/address";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (address: Address | null) => void;
  onAddNew: () => void;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
}: AddressSelectorProps) {
  const sorted = [...addresses].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  const isAddNewSelected = selectedId === null && addresses.length > 0;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((addr) => (
        <AddressCard
          key={addr.documentId}
          address={addr}
          selected={selectedId === addr.documentId}
          onSelect={() => onSelect(addr)}
        />
      ))}
      <div
        onClick={onAddNew}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border p-6 transition-all hover:border-primary hover:bg-muted/50 ${
          isAddNewSelected
            ? "border-primary ring-2 ring-primary bg-muted/30"
            : ""
        }`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onAddNew();
        }}
      >
        <div className="mb-2 rounded-full bg-secondary p-2">
          <Plus className="size-5 text-muted-foreground" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          Tambah Alamat Baru
        </span>
      </div>
    </div>
  );
}
