"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { AddressForm } from "@/components/addresses/address-form";
import { useAddresses } from "@/hooks/use-addresses";
import type { Address, AddressFormData } from "@/types/address";

interface AddressSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  address?: Address | null;
}

export function AddressSheet({ open, onOpenChange, address }: AddressSheetProps) {
  const { createAddress, updateAddress, isCreating, isUpdating } = useAddresses();
  const isEditing = !!address;
  const isSubmitting = isCreating || isUpdating;

  const handleSubmit = async (data: AddressFormData) => {
    if (isEditing && address) {
      await updateAddress({ id: address.documentId, data });
    } else {
      await createAddress(data);
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Alamat" : "Tambah Alamat"}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Perbarui detail alamat pengiriman"
              : "Isi detail alamat pengiriman baru"}
          </SheetDescription>
        </SheetHeader>
        <AddressForm
          initialData={
            address
              ? {
                  label: address.label,
                  firstName: address.firstName,
                  lastName: address.lastName,
                  phone: address.phone,
                  addressLine1: address.addressLine1,
                  city: address.city,
                  state: address.state,
                  postalCode: address.postalCode,
                  country: address.country,
                  isDefault: address.isDefault,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel={isEditing ? "Perbarui" : "Simpan"}
        />
      </SheetContent>
    </Sheet>
  );
}
