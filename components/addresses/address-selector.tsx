"use client";

import { useState } from "react";
import { Plus, MapPin } from "lucide-react";
import { AddressPickerSheet } from "@/components/addresses/address-picker-sheet";
import type { Address } from "@/types/address";
import { sortAddressesByDefault } from "@/lib/utils/address";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId: string | null;
  onSelect: (address: Address) => void;
  onAddNew: () => void;
  isAddingNew?: boolean;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAddNew,
  isAddingNew = false,
}: AddressSelectorProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const sorted = sortAddressesByDefault(addresses);

  const selectedAddress = selectedId
    ? (sorted.find((a) => a.documentId === selectedId) ?? null)
    : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1: Currently selected address, or CTA when none */}
        {selectedAddress ? (
          <div
            onClick={isAddingNew ? () => onSelect(selectedAddress) : undefined}
            className={`rounded-lg border p-4 transition-all ${isAddingNew ? "cursor-pointer border-border hover:shadow-md hover:border-primary" : "border-primary ring-2 ring-primary"}`}
            role={isAddingNew ? "button" : undefined}
            tabIndex={isAddingNew ? 0 : undefined}
            onKeyDown={
              isAddingNew
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") onSelect(selectedAddress);
                  }
                : undefined
            }
          >
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedAddress.label && (
                    <span className="text-sm font-semibold text-foreground">
                      {selectedAddress.label}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    {selectedAddress.isDefault ? "Utama" : "Dipilih"}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {selectedAddress.firstName} {selectedAddress.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{selectedAddress.phone}</p>
                <p className="text-sm text-muted-foreground">{selectedAddress.addressLine1}</p>
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsPickerOpen(true)}
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border p-4 transition-all hover:border-primary hover:bg-muted/50"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setIsPickerOpen(true);
            }}
          >
            <MapPin className="mb-2 size-6 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground text-center">
              Belum ada alamat utama
            </span>
            <span className="text-xs text-muted-foreground mt-1">Pilih alamat pengiriman</span>
          </div>
        )}

        {/* Card 2: Pilih Alamat — opens picker sheet */}
        <div
          onClick={() => setIsPickerOpen(true)}
          className="flex flex-col cursor-pointer items-center justify-center rounded-lg border border-border p-4 transition-all hover:shadow-md hover:border-primary"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsPickerOpen(true);
          }}
        >
          <div className="mb-2 rounded-full bg-secondary p-2">
            <MapPin className="size-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Pilih Alamat</span>
        </div>

        {/* Card 3: Tambah Alamat Baru — toggles to inline form */}
        <div
          onClick={onAddNew}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-4 transition-all hover:border-primary hover:bg-muted/50 ${isAddingNew ? "border-primary ring-2 ring-primary bg-muted/30" : "border-border"}`}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onAddNew();
          }}
        >
          <div className="mb-2 rounded-full bg-secondary p-2">
            <Plus className="size-5 text-muted-foreground" />
          </div>
          <span className="text-sm font-medium text-muted-foreground">Tambah Alamat Baru</span>
        </div>
      </div>

      <AddressPickerSheet
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        addresses={addresses}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </>
  );
}
