"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AddressCard } from "@/components/addresses/address-card";
import type { Address } from "@/types/address";
import { sortAddressesByDefault } from "@/lib/utils/address";

interface AddressPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addresses: Address[];
  selectedId: string | null;
  onSelect: (address: Address) => void;
}

export function AddressPickerSheet({
  open,
  onOpenChange,
  addresses,
  selectedId,
  onSelect,
}: AddressPickerSheetProps) {
  const sorted = sortAddressesByDefault(addresses);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleSelect = (address: Address) => {
    onSelect(address);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="flex flex-col gap-4 overflow-y-auto p-0"
      >
        <SheetHeader className="p-4 pb-2">
          <SheetTitle>Pilih Alamat</SheetTitle>
          <SheetDescription>Pilih alamat pengiriman yang sudah tersimpan</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-4">
          {addresses.length === 0 ? (
            <p className="py-8 text-sm text-muted-foreground text-center">
              Belum ada alamat tersimpan
            </p>
          ) : (
            sorted.map((addr) => (
              <AddressCard
                key={addr.documentId}
                address={addr}
                selected={selectedId === addr.documentId}
                onSelect={() => handleSelect(addr)}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
